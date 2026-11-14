// services/socket.service.js
const { verifyToken } = require('../configs/jwt.config');

/**
 * Capa de tiempo real (Socket.IO).
 * - Auth por JWT en el handshake: socket.handshake.auth.token
 * - Rooms: mission:{missionId} (toda la tripulación) y user:{userId} (personal)
 * - Los servicios llaman a los emit*; si io no está inicializado son no-op
 *   (scripts, seeds y tests no levantan el socket).
 */
let io = null;

const init = (httpServer) => {
    const { Server } = require('socket.io');
    io = new Server(httpServer, {
        cors: { origin: true, credentials: true }
    });

    // Middleware: JWT obligatorio
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Token requerido'));
            const payload = verifyToken(token);
            socket.user = { id: payload.sub, role: payload.role, missionId: payload.missionId };
            next();
        } catch {
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        const { id, role, missionId } = socket.user;
        socket.join(`mission:${missionId}`);
        socket.join(`user:${id}`);
        console.log(`⇄ Socket conectado: ${id} (${role}) → mission:${missionId}`);
        socket.on('disconnect', () => console.log(`⇄ Socket desconectado: ${id}`));
    });

    return io;
};

const missionRoom = (missionId) => `mission:${missionId}`;

/** Nueva métrica guardada → dashboards en vivo. */
const emitMetric = (metric) => {
    if (!io) return;
    io.to(missionRoom(metric.missionId)).emit('metric:new', {
        _id: metric._id,
        astronaut: metric.astronaut ? String(metric.astronaut) : null,
        type: metric.type,
        value: metric.value,
        unit: metric.unit,
        scope: metric.scope,
        source: metric.source,
        missionId: metric.missionId,
        recordedAt: metric.recordedAt
    });
};

const alertPayload = (a) => ({
    _id: a._id,
    astronaut: a.astronaut ? String(a.astronaut) : null,
    ruleKey: a.ruleKey,
    severity: a.severity,
    status: a.status,
    message: a.message,
    metricType: a.metricType,
    metricValue: a.metricValue,
    missionId: a.missionId,
    createdAt: a.createdAt
});

/** Alerta recién creada → médicos/tripulación la ven al instante. */
const emitAlertNew = (alert) => {
    if (!io || !alert) return;
    io.to(missionRoom(alert.missionId)).emit('alert:new', alertPayload(alert));
};

/** Cambio de estado (ack/resolved/auto-resolved). */
const emitAlertUpdated = (alert) => {
    if (!io || !alert) return;
    io.to(missionRoom(alert.missionId)).emit('alert:updated', alertPayload(alert));
};

module.exports = { init, emitMetric, emitAlertNew, emitAlertUpdated };
