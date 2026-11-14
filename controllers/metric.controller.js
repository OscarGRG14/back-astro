// controllers/metric.controller.js
const asyncHandler = require('express-async-handler');
const metricService = require('../services/metric.service');
const { isValidObjectId } = require('../utils/mongo.util');

/**
 * Astronauta solo ve/registra sus propios datos; medic/admin pueden
 * especificar ?astronautId para cualquier tripulante.
 */
const targetAstronaut = (req) =>
    (req.user.role === 'astronaut' ? req.user._id : (req.query.astronautId || req.body?.astronautId || req.user._id));

// POST /metrics — entrada manual de un signo vital
const createManual = asyncHandler(async (req, res) => {
    const { type, value, recordedAt } = req.body;
    if (type === undefined || value === undefined) {
        return res.status(400).json({ message: 'type y value son obligatorios' });
    }
    const metric = await metricService.createManual({
        astronautId: targetAstronaut(req),
        type, value, recordedAt,
        missionId: req.user.missionId
    });
    res.status(201).json(metric);
});

// GET /metrics?type=&from=&to=&scope=&astronautId=
const history = asyncHandler(async (req, res) => {
    const { type, from, to, scope, limit } = req.query;
    // Las métricas de ambiente son de la misión, no de un astronauta
    const astronaut = scope === 'environment'
        ? undefined
        : (req.user.role === 'astronaut' ? req.user._id : req.query.astronautId);
    if (!astronaut && scope !== 'environment') {
        return res.status(400).json({ message: 'astronautId requerido (o scope=environment)' });
    }
    if (astronaut && !isValidObjectId(astronaut)) {
        return res.status(400).json({ message: 'astronautId inválido' });
    }
    const data = await metricService.getHistory({
        astronaut, type, scope, from, to, limit: Number(limit) || 200,
        missionId: req.user.missionId
    });
    res.json(data);
});

// GET /metrics/latest — últimos signos vitales (o ambiente con ?scope=environment)
const latest = asyncHandler(async (req, res) => {
    if (req.query.scope === 'environment') {
        return res.json(await metricService.getLatestEnvironment(req.user.missionId));
    }
    const astronaut = targetAstronaut(req);
    res.json(await metricService.getLatestVitals(astronaut));
});

module.exports = { createManual, history, latest };
