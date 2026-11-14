// services/insight.service.js
const metricRepository = require('../repositories/metric.repository');
const alertRepository = require('../repositories/alert.repository');
const insightRepository = require('../repositories/insight.repository');
const recordsRepository = require('../repositories/records.repository');
const geminiService = require('./gemini.service');

const WINDOW_HOURS = 24;

/**
 * Construye el contexto de salud del astronauta para el prompt de IA:
 * vitales recientes, ambiente, alertas, sueño, ejercicio, ánimo, síntomas.
 */
const buildContext = async (astronaut, missionId) => {
    const to = new Date();
    const from = new Date(to.getTime() - WINDOW_HOURS * 60 * 60 * 1000);
    const weekAgo = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [vitals, environment, alerts, sleep, exercise, mood, symptoms, radiationTotal] = await Promise.all([
        metricRepository.summaryInWindow({ astronaut, scope: 'vital', from, to }),
        metricRepository.summaryInWindow({ scope: 'environment', missionId, from, to }),
        alertRepository.findActive({ astronaut, missionId }),
        recordsRepository.sleep.find({ astronaut, date: { $gte: weekAgo } }, { sort: { date: -1 }, limit: 7 }),
        recordsRepository.exercise.find({ astronaut, date: { $gte: weekAgo } }, { sort: { date: -1 }, limit: 20 }),
        recordsRepository.mood.find({ astronaut }, { sort: { recordedAt: -1 }, limit: 5 }),
        recordsRepository.symptom.find({ astronaut, recordedAt: { $gte: weekAgo } }, { sort: { recordedAt: -1 }, limit: 10 }),
        metricRepository.sumType({ type: 'radiation_dose', missionId }),
    ]);

    return {
        windowHours: WINDOW_HOURS,
        astronautProfile: astronaut.perfil || {},
        baseline: astronaut.baseline || {},
        vitals,
        environment,
        radiationAccumulated_mSv: Number(radiationTotal.toFixed(3)),
        activeAlerts: alerts.map((a) => ({ severity: a.severity, message: a.message })),
        sleepLast7d: sleep.map((s) => ({ date: s.date, minutes: s.durationMinutes, quality: s.quality })),
        exerciseLast7d: exercise.map((e) => ({ date: e.date, type: e.exerciseType, minutes: e.durationMinutes })),
        moodAssessments: mood.map((m) => ({ instrument: m.instrument, score: m.score, date: m.recordedAt })),
        symptoms: symptoms.map((s) => ({ description: s.description, severity: s.severity, date: s.recordedAt })),
    };
};

/**
 * Genera (y persiste) el insight diario. Si ya existe uno de hoy y no se fuerza,
 * lo reutiliza para no gastar cuota de la API.
 */
const generateDailyInsight = async (astronaut, { force = false } = {}) => {
    if (!force) {
        const cached = await insightRepository.findToday(astronaut._id, 'daily');
        if (cached) return { insight: cached, cached: true };
    }

    const context = await buildContext(astronaut._id, astronaut.missionId);
    const { content, model } = await geminiService.generateHealthInsight(context);

    const insight = await insightRepository.create({
        astronaut: astronaut._id,
        period: 'daily',
        content: {
            summary: content.summary,
            riskLevel: content.riskLevel,
            recommendations: content.recommendations || [],
            focusAreas: content.focusAreas || []
        },
        dataWindow: {
            from: new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000),
            to: new Date()
        },
        model,
        missionId: astronaut.missionId
    });

    return { insight, cached: false };
};

const getLatest = (astronautId, period = 'daily') =>
    insightRepository.findLatest(astronautId, period);

module.exports = { buildContext, generateDailyInsight, getLatest };
