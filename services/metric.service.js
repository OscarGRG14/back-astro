// services/metric.service.js
const { METRIC_TYPES, isValidMetricType, isValueInRange } = require('../configs/metric-types.config');
const metricRepository = require('../repositories/metric.repository');
const alertService = require('./alert.service');
const socketService = require('./socket.service');

/**
 * Ingesta batch de lecturas desde un dispositivo (ESP32).
 * Cada lectura: { type, value, ts? }. Las inválidas se reportan y se descartan.
 * Las métricas 'vital' se asocian al astronauta asignado al dispositivo.
 */
const ingestReadings = async (device, readings) => {
    if (!Array.isArray(readings) || readings.length === 0) {
        throw Object.assign(new Error('Se requiere un array "readings" no vacío'), { status: 400 });
    }

    const docs = [];
    const rejected = [];

    for (const r of readings) {
        const { type, value, ts } = r;
        if (!isValidMetricType(type)) {
            rejected.push({ reading: r, reason: `tipo desconocido: ${type}` });
            continue;
        }
        if (!isValueInRange(type, value)) {
            rejected.push({ reading: r, reason: 'valor fuera de rango' });
            continue;
        }

        const def = METRIC_TYPES[type];
        docs.push({
            astronaut: def.scope === 'vital' ? device.assignedTo : null,
            type,
            value,
            unit: def.unit,
            scope: def.scope,
            source: 'device',
            device: device._id,
            missionId: device.missionId,
            recordedAt: ts ? new Date(ts) : new Date()
        });
    }

    const inserted = docs.length ? await metricRepository.insertMany(docs) : [];

    // Evaluar alertas y emitir en vivo por cada lectura insertada
    for (const m of inserted) {
        socketService.emitMetric(m);
        alertService.evaluateMetric(m).catch((e) =>
            console.error(`✗ Error evaluando alerta para ${m.type}:`, e.message));
    }

    return { accepted: inserted.length, rejected };
};

/** Entrada manual de un signo vital por el astronauta o el médico. */
const createManual = async ({ astronautId, type, value, recordedAt, missionId }) => {
    if (!isValidMetricType(type)) {
        throw Object.assign(new Error(`Tipo de métrica inválido: ${type}`), { status: 400 });
    }
    if (METRIC_TYPES[type].scope !== 'vital') {
        throw Object.assign(new Error(`"${type}" es una métrica de ambiente, no de signo vital`), { status: 400 });
    }
    if (!isValueInRange(type, value)) {
        throw Object.assign(new Error(`Valor fuera de rango para ${type}`), { status: 400 });
    }

    const def = METRIC_TYPES[type];
    const metric = await metricRepository.create({
        astronaut: astronautId,
        type,
        value,
        unit: def.unit,
        scope: 'vital',
        source: 'manual',
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        missionId
    });

    socketService.emitMetric(metric);
    alertService.evaluateMetric(metric).catch((e) =>
        console.error(`✗ Error evaluando alerta para ${type}:`, e.message));

    return metric;
};

const getHistory = (params) => metricRepository.history(params);

const getLatestVitals = (astronautId) =>
    metricRepository.latestByScope({ astronaut: astronautId, scope: 'vital' });

const getLatestEnvironment = (missionId) =>
    metricRepository.latestByScope({ scope: 'environment', missionId });

module.exports = {
    ingestReadings,
    createManual,
    getHistory,
    getLatestVitals,
    getLatestEnvironment,
};
