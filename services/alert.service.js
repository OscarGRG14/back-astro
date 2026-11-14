// services/alert.service.js
const { ALERT_RULES, MOOD_RULES, RADIATION_LIMITS, SEVERITY_ORDER } = require('../configs/alert-rules.config');
const alertRepository = require('../repositories/alert.repository');
const metricRepository = require('../repositories/metric.repository');
const socketService = require('./socket.service');

/**
 * Motor de alertas: evalúa cada lectura/cuestionario contra las reglas.
 * - Dispara la regla de mayor severidad que coincida por tipo de métrica.
 * - Anti-spam: no duplica alertas 'active' del mismo ruleKey + astronauta.
 * - Auto-resuelve alertas activas del tipo cuando el valor vuelve a rango.
 */

const ruleMatches = (rule, value) =>
    rule.condition === 'above' ? value > rule.threshold : value < rule.threshold;

const createAlert = async ({ astronaut, ruleKey, severity, message, metricType, metricValue, missionId, source }) => {
    const existing = await alertRepository.findActiveByRule({ astronaut, ruleKey, missionId });
    if (existing) return existing; // anti-spam

    const alert = await alertRepository.create({
        astronaut, ruleKey, severity, message,
        metricType, metricValue, missionId, source: source || 'rule_engine'
    });
    socketService.emitAlertNew(alert);
    return alert;
};

/**
 * Evalúa una lectura de métrica recién guardada.
 * Devuelve la alerta creada (o null si no aplica / ya existía).
 */
const evaluateMetric = async (metric) => {
    const { type, value, astronaut, missionId } = metric;
    const rules = ALERT_RULES
        .filter((r) => r.metricType === type)
        .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);

    const triggered = rules.find((r) => ruleMatches(r, value));

    const alert = triggered
        ? await createAlert({
            astronaut: astronaut || null,
            ruleKey: triggered.key,
            severity: triggered.severity,
            message: `${triggered.message} — valor: ${value}`,
            metricType: type,
            metricValue: value,
            missionId
        })
        : null;

    // Auto-resolver: lecturas en rango normal cierran alertas activas del tipo
    const active = await alertRepository.findActiveForAutoResolve({
        astronaut: astronaut || null, metricType: type, missionId
    });
    for (const a of active) {
        const rule = ALERT_RULES.find((r) => r.key === a.ruleKey);
        if (rule && !ruleMatches(rule, value)) {
            const resolved = await alertRepository.resolve(a._id);
            socketService.emitAlertUpdated(resolved || { ...a, status: 'resolved' });
        }
    }

    // Radiación: verificar acumulado de misión en cada dosis reportada
    if (type === 'radiation_dose') {
        const total = await metricRepository.sumType({ type, missionId });
        if (total >= RADIATION_LIMITS.missionCritical) {
            await createAlert({
                astronaut: astronaut || null,
                ruleKey: 'radiation_cumulative_critical',
                severity: 'critical',
                message: `Dosis acumulada de radiación crítica: ${total.toFixed(2)} mSv (límite ${RADIATION_LIMITS.missionCritical})`,
                metricType: type, metricValue: total, missionId, source: 'radiation'
            });
        } else if (total >= RADIATION_LIMITS.missionWarning) {
            await createAlert({
                astronaut: astronaut || null,
                ruleKey: 'radiation_cumulative_warning',
                severity: 'warning',
                message: `Dosis acumulada de radiación elevada: ${total.toFixed(2)} mSv`,
                metricType: type, metricValue: total, missionId, source: 'radiation'
            });
        }
    }

    return alert;
};

/** Evalúa un cuestionario de salud conductual contra sus umbrales clínicos. */
const evaluateMoodAssessment = async (assessment) => {
    const rules = MOOD_RULES[assessment.instrument];
    if (!rules) return null;

    const triggered = rules.find((r) => assessment.score >= r.min);
    if (!triggered) return null;

    return createAlert({
        astronaut: assessment.astronaut,
        ruleKey: `mood_${assessment.instrument.toLowerCase()}_${triggered.severity}`,
        severity: triggered.severity,
        message: `${triggered.message} — puntaje: ${assessment.score}`,
        metricType: assessment.instrument.toLowerCase(),
        metricValue: assessment.score,
        missionId: assessment.missionId,
        source: 'mood_assessment'
    });
};

const listActive = (filters) => alertRepository.findActive(filters);

const acknowledge = async (id, userId) => {
    const alert = await alertRepository.acknowledge(id, userId);
    socketService.emitAlertUpdated(alert);
    return alert;
};

const resolve = async (id) => {
    const alert = await alertRepository.resolve(id);
    socketService.emitAlertUpdated(alert);
    return alert;
};

module.exports = { evaluateMetric, evaluateMoodAssessment, listActive, acknowledge, resolve };
