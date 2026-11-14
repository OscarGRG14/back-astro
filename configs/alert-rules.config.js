// configs/alert-rules.config.js
/**
 * Reglas del motor de alertas.
 * Cada lectura de métrica se evalúa contra las reglas de su `metricType`.
 * Se dispara la regla de MAYOR severidad que coincida (critical > warning > info).
 * Anti-spam: no se duplica una alerta que ya está 'active' para el mismo
 * astronauta + ruleKey; si la lectura vuelve a rango normal, se auto-resuelve.
 */
const ALERT_RULES = [
    // SpO2
    { key: 'spo2_critical', metricType: 'spo2', condition: 'below', threshold: 88,  severity: 'critical', message: 'SpO2 críticamente bajo (<88%)' },
    { key: 'spo2_low',      metricType: 'spo2', condition: 'below', threshold: 92,  severity: 'warning',  message: 'SpO2 por debajo de lo normal (<92%)' },

    // Frecuencia cardíaca
    { key: 'hr_critical_high', metricType: 'heart_rate', condition: 'above', threshold: 140, severity: 'critical', message: 'Frecuencia cardíaca muy elevada (>140 bpm)' },
    { key: 'hr_high',          metricType: 'heart_rate', condition: 'above', threshold: 110, severity: 'warning',  message: 'Frecuencia cardíaca elevada (>110 bpm)' },
    { key: 'hr_low',           metricType: 'heart_rate', condition: 'below', threshold: 40,  severity: 'warning',  message: 'Frecuencia cardíaca baja (<40 bpm)' },

    // Temperatura corporal
    { key: 'temp_fever_high', metricType: 'body_temperature', condition: 'above', threshold: 39.5, severity: 'critical', message: 'Fiebre alta (>39.5°C)' },
    { key: 'temp_fever',      metricType: 'body_temperature', condition: 'above', threshold: 38.0, severity: 'warning',  message: 'Fiebre (>38°C)' },
    { key: 'temp_low',        metricType: 'body_temperature', condition: 'below', threshold: 35.5, severity: 'warning',  message: 'Hipotermia leve (<35.5°C)' },

    // Presión arterial
    { key: 'bp_sys_critical', metricType: 'blood_pressure_systolic', condition: 'above', threshold: 180, severity: 'critical', message: 'Crisis hipertensiva (sistólica >180)' },
    { key: 'bp_sys_high',     metricType: 'blood_pressure_systolic', condition: 'above', threshold: 140, severity: 'warning',  message: 'Presión sistólica elevada (>140)' },
    { key: 'bp_sys_low',      metricType: 'blood_pressure_systolic', condition: 'below', threshold: 90,  severity: 'warning',  message: 'Hipotensión (sistólica <90)' },

    // CO2 en cabina (límite operativo ISS ~5000 ppm)
    { key: 'co2_critical', metricType: 'co2', condition: 'above', threshold: 5000, severity: 'critical', message: 'CO2 en cabina en nivel crítico (>5000 ppm)' },
    { key: 'co2_high',     metricType: 'co2', condition: 'above', threshold: 2000, severity: 'warning',  message: 'CO2 en cabina elevado (>2000 ppm)' },
];

// Umbrales para cuestionarios de salud conductual (se evalúan en MoodAssessment)
const MOOD_RULES = {
    PHQ9: [ { min: 15, severity: 'critical', message: 'PHQ-9 >= 15: síntomas depresivos moderadamente severos' },
            { min: 10, severity: 'warning',  message: 'PHQ-9 >= 10: posible depresión moderada' } ],
    GAD7: [ { min: 15, severity: 'critical', message: 'GAD-7 >= 15: ansiedad severa' },
            { min: 10, severity: 'warning',  message: 'GAD-7 >= 10: ansiedad moderada' } ],
    PSS:  [ { min: 27, severity: 'warning',  message: 'PSS >= 27: estrés percibido alto' } ],
};

// Límite de dosis acumulada de radiación para la misión (mSv)
const RADIATION_LIMITS = { missionWarning: 100, missionCritical: 250 };

const SEVERITY_ORDER = { info: 1, warning: 2, critical: 3 };

module.exports = { ALERT_RULES, MOOD_RULES, RADIATION_LIMITS, SEVERITY_ORDER };
