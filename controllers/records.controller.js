// controllers/records.controller.js
const asyncHandler = require('express-async-handler');
const recordsRepository = require('../repositories/records.repository');
const alertService = require('../services/alert.service');

/**
 * CRUD genérico para registros de bienestar (sleep, exercise, mood, symptoms).
 * El astronauta registra/lee lo suyo; medic puede consultar con ?astronautId=.
 */
const repoFor = (kind) => {
    const repo = recordsRepository[kind];
    if (!repo) throw new Error(`Tipo de registro desconocido: ${kind}`);
    return repo;
};

const targetAstronaut = (req) =>
    (req.user.role === 'astronaut' ? req.user._id : (req.query.astronautId || req.body?.astronautId || req.user._id));

const makeCreate = (kind) => asyncHandler(async (req, res) => {
    const repo = repoFor(kind);
    const doc = await repo.create({
        ...req.body,
        astronaut: targetAstronaut(req),
        missionId: req.user.missionId
    });

    // Los cuestionarios de ánimo disparan evaluación de alertas
    if (kind === 'mood') {
        alertService.evaluateMoodAssessment(doc).catch((e) =>
            console.error('✗ Error evaluando mood assessment:', e.message));
    }

    res.status(201).json(doc);
});

const makeList = (kind) => asyncHandler(async (req, res) => {
    const repo = repoFor(kind);
    const filter = { astronaut: targetAstronaut(req) };
    if (kind === 'mood' && req.query.instrument) filter.instrument = req.query.instrument;
    const sortField = kind === 'sleep' || kind === 'exercise' ? 'date' : 'recordedAt';
    const docs = await repo.find(filter, {
        sort: { [sortField]: -1 },
        limit: Number(req.query.limit) || 50
    });
    res.json(docs);
});

module.exports = {
    createSleep: makeCreate('sleep'),
    listSleep: makeList('sleep'),
    createExercise: makeCreate('exercise'),
    listExercise: makeList('exercise'),
    createMood: makeCreate('mood'),
    listMood: makeList('mood'),
    createSymptom: makeCreate('symptom'),
    listSymptoms: makeList('symptom'),
};
