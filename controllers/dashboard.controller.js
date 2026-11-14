// controllers/dashboard.controller.js
const asyncHandler = require('express-async-handler');
const dashboardService = require('../services/dashboard.service');
const userRepository = require('../repositories/user.repository');
const { isValidObjectId } = require('../utils/mongo.util');

// GET /dashboard/summary — del astronauta (o ?astronautId= para medic/admin)
const summary = asyncHandler(async (req, res) => {
    let astronaut = req.user;
    if (req.user.role !== 'astronaut' && req.query.astronautId) {
        if (!isValidObjectId(req.query.astronautId)) {
            return res.status(400).json({ message: 'astronautId inválido' });
        }
        astronaut = await userRepository.findActiveById(req.query.astronautId);
        if (!astronaut) return res.status(404).json({ message: 'Astronauta no encontrado' });
    }
    res.json(await dashboardService.summary({ astronaut, missionId: astronaut.missionId }));
});

// GET /dashboard/crew — vista de control de misión (medic/admin)
const crew = asyncHandler(async (req, res) => {
    res.json(await dashboardService.crewOverview(req.user.missionId));
});

module.exports = { summary, crew };
