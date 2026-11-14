// configs/jwt.config.js
const jwt = require('jsonwebtoken');
const { env } = require('./env.config');

/**
 * Helpers centralizados para firmar y verificar JWT.
 * Payload esperado: { sub: <userId>, role, missionId }
 */
const signToken = (payload) =>
    jwt.sign(payload, env.jwt.JWT_SECRET, { expiresIn: env.jwt.JWT_EXPIRES_IN });

const verifyToken = (token) => jwt.verify(token, env.jwt.JWT_SECRET);

module.exports = { signToken, verifyToken };
