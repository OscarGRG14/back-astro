// services/dashboard.service.js
const metricRepository = require('../repositories/metric.repository');
const alertRepository = require('../repositories/alert.repository');
const insightRepository = require('../repositories/insight.repository');
const recordsRepository = require('../repositories/records.repository');
const userRepository = require('../repositories/user.repository');

/**
 * Score de salud compuesto 0-100:
 *   -25 por alerta critical activa
 *   -10 por alerta warning activa
 *    -3 por alerta info activa
 *   -10 si no hay datos de vitales en las últimas 24h (sin monitoreo)
 *   -10 si el último PHQ-9 >= 10
 */
const computeHealthScore = ({ activeAlerts, latestVitals, latestMood }) => {
    let score = 100;
    const penalty = { critical: 25, warning: 10, info: 3 };
    for (const a of activeAlerts) score -= penalty[a.severity] || 0;
    if (latestVitals.length === 0) score -= 10;
    const phq9 = latestMood.find((m) => m.instrument === 'PHQ9');
    if (phq9 && phq9.score >= 10) score -= 10;
    return Math.max(0, score);
};

const summary = async ({ astronaut, missionId }) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [latestVitals, latestEnv, activeAlerts, latestInsight, sleep, exercise, mood, radiationTotal] =
        await Promise.all([
            metricRepository.latestByScope({ astronaut: astronaut._id, scope: 'vital' }),
            metricRepository.latestByScope({ scope: 'environment', missionId }),
            alertRepository.findActive({ astronaut: astronaut._id, missionId }),
            insightRepository.findLatest(astronaut._id),
            recordsRepository.sleep.find({ astronaut: astronaut._id, date: { $gte: weekAgo } }),
            recordsRepository.exercise.find({ astronaut: astronaut._id, date: { $gte: weekAgo } }),
            recordsRepository.mood.find({ astronaut: astronaut._id }, { sort: { recordedAt: -1 }, limit: 5 }),
            metricRepository.sumType({ type: 'radiation_dose', missionId }),
        ]);

    const avgSleepMinutes = sleep.length
        ? Math.round(sleep.reduce((a, s) => a + s.durationMinutes, 0) / sleep.length)
        : null;
    const exerciseMinutes7d = exercise.reduce((a, e) => a + e.durationMinutes, 0);

    return {
        astronaut: { id: astronaut._id, nombre: astronaut.fullName, missionId: astronaut.missionId },
        healthScore: computeHealthScore({ activeAlerts, latestVitals, latestMood: mood }),
        vitals: latestVitals,
        baseline: astronaut.baseline,
        environment: latestEnv,
        radiationAccumulated_mSv: Number(radiationTotal.toFixed(3)),
        activeAlerts: activeAlerts.map((a) => ({
            id: a._id, severity: a.severity, message: a.message, createdAt: a.createdAt
        })),
        wellness7d: { avgSleepMinutes, exerciseMinutes: exerciseMinutes7d, exerciseSessions: exercise.length },
        latestMood: mood.map((m) => ({ instrument: m.instrument, score: m.score, date: m.recordedAt })),
        insight: latestInsight ? latestInsight.content : null,
    };
};

/** Vista de control de misión: resumen de toda la tripulación. */
const crewOverview = async (missionId) => {
    const astronauts = await userRepository.findAstronauts(missionId);
    const out = [];
    for (const a of astronauts) {
        const [latestVitals, activeAlerts] = await Promise.all([
            metricRepository.latestByScope({ astronaut: a._id, scope: 'vital' }),
            alertRepository.findActive({ astronaut: a._id, missionId }),
        ]);
        out.push({
            astronaut: { id: a._id, nombre: a.fullName },
            healthScore: computeHealthScore({ activeAlerts, latestVitals, latestMood: [] }),
            vitals: latestVitals,
            activeAlertCount: activeAlerts.length,
            worstSeverity: activeAlerts[0]?.severity || null,
        });
    }
    return out;
};

module.exports = { summary, crewOverview, computeHealthScore };
