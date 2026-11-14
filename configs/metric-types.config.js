// configs/metric-types.config.js
/**
 * Catálogo de tipos de métricas aceptadas por el sistema.
 * ES EL CONTRATO con el firmware del ESP32 y con el simulador:
 * solo se aceptan los `type` listados aquí, dentro del rango [min, max].
 *
 * scope 'vital'       -> métrica fisiológica del astronauta (requiere astronautId)
 * scope 'environment' -> métrica de la cabina / misión
 */
const METRIC_TYPES = {
    // --- Vitales ---
    heart_rate:               { scope: 'vital', unit: 'bpm',  min: 20,  max: 250 },
    spo2:                     { scope: 'vital', unit: '%',    min: 50,  max: 100 },
    blood_pressure_systolic:  { scope: 'vital', unit: 'mmHg', min: 50,  max: 250 },
    blood_pressure_diastolic: { scope: 'vital', unit: 'mmHg', min: 30,  max: 180 },
    body_temperature:         { scope: 'vital', unit: '°C',   min: 30,  max: 45 },
    respiration_rate:         { scope: 'vital', unit: 'rpm',  min: 4,   max: 60 },

    // --- Ambiente de cabina ---
    co2:                  { scope: 'environment', unit: 'ppm', min: 300, max: 20000 },
    humidity:             { scope: 'environment', unit: '%',   min: 0,   max: 100 },
    ambient_temperature:  { scope: 'environment', unit: '°C',  min: -20, max: 60 },
    radiation_dose:       { scope: 'environment', unit: 'mSv', min: 0,   max: 1000 },
};

const isValidMetricType = (type) => Object.hasOwn(METRIC_TYPES, type);

const isValueInRange = (type, value) => {
    const def = METRIC_TYPES[type];
    return def && typeof value === 'number' && value >= def.min && value <= def.max;
};

module.exports = { METRIC_TYPES, isValidMetricType, isValueInRange };
