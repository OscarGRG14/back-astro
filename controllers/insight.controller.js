// controllers/insight.controller.js
const asyncHandler = require('express-async-handler');
const insightService = require('../services/insight.service');
const userRepository = require('../repositories/user.repository');
const { isValidObjectId } = require('../utils/mongo.util');

const resolveAstronaut = async (req) => {
    if (req.user.role === 'astronaut') return req.user;
    const id = req.query.astronautId || req.body?.astronautId;
    if (!id) throw Object.assign(new Error('astronautId requerido'), { status: 400 });
    if (!isValidObjectId(id)) throw Object.assign(new Error('astronautId inválido'), { status: 400 });
    const user = await userRepository.findActiveById(id);
    if (!user) throw Object.assign(new Error('Astronauta no encontrado'), { status: 404 });
    return user;
};

// GET /insights/daily — devuelve el de hoy (o lo genera si no existe)
const daily = asyncHandler(async (req, res) => {
    const astronaut = await resolveAstronaut(req);
    const result = await insightService.generateDailyInsight(astronaut);
    res.json(result);
});

// POST /insights/generate — fuerza regeneración con datos frescos
const generate = asyncHandler(async (req, res) => {
    const astronaut = await resolveAstronaut(req);
    const result = await insightService.generateDailyInsight(astronaut, { force: true });
    res.status(201).json(result);
});

module.exports = { daily, generate };
