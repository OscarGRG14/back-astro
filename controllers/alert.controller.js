// controllers/alert.controller.js
const asyncHandler = require('express-async-handler');
const alertService = require('../services/alert.service');
const { isValidObjectId } = require('../utils/mongo.util');

// GET /alerts — activas. Astronauta ve las suyas; medic/admin pueden filtrar por astronautId.
const list = asyncHandler(async (req, res) => {
    const { astronautId, severity, includeResolved } = req.query;
    const astronaut = req.user.role === 'astronaut' ? req.user._id : astronautId;

    let alerts;
    if (includeResolved === 'true') {
        const filter = { missionId: req.user.missionId };
        if (astronaut) filter.astronaut = astronaut;
        if (severity) filter.severity = severity;
        const Alert = require('../models/alert.model');
        alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
    } else {
        alerts = await alertService.listActive({
            astronaut, missionId: req.user.missionId, severity
        });
    }
    res.json(alerts);
});

// PATCH /alerts/:id/acknowledge — medic/admin o el propio astronauta
const acknowledge = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    const alert = await alertService.acknowledge(req.params.id, req.user._id);
    if (!alert) return res.status(404).json({ message: 'Alerta no encontrada' });
    res.json(alert);
});

// PATCH /alerts/:id/resolve
const resolve = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    const alert = await alertService.resolve(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alerta no encontrada' });
    res.json(alert);
});

module.exports = { list, acknowledge, resolve };
