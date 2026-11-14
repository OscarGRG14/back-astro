// repositories/alert.repository.js
const Alert = require('../models/alert.model');
const BaseRepository = require('./base.repository');

class AlertRepository extends BaseRepository {
    constructor() {
        super(Alert);
    }

    /** ¿Ya existe una alerta activa para este astronauta + regla? (anti-spam) */
    findActiveByRule({ astronaut, ruleKey, missionId }) {
        return this.model.findOne({ astronaut, ruleKey, missionId, status: 'active' });
    }

    /** Alertas activas de una regla para auto-resolverlas si el valor se normalizó. */
    findActiveForAutoResolve({ astronaut, metricType, missionId }) {
        return this.model.find({ astronaut, metricType, missionId, status: 'active' });
    }

    findActive({ astronaut, missionId, severity } = {}) {
        const filter = { status: 'active' };
        if (astronaut) filter.astronaut = astronaut;
        if (missionId) filter.missionId = missionId;
        if (severity) filter.severity = severity;
        return this.model.find(filter).sort({ severity: -1, createdAt: -1 });
    }

    acknowledge(id, userId) {
        return this.model.findByIdAndUpdate(id, {
            status: 'acknowledged',
            acknowledgedBy: userId,
            acknowledgedAt: new Date()
        }, { returnDocument: 'after' });
    }

    resolve(id) {
        return this.model.findByIdAndUpdate(id, {
            status: 'resolved',
            resolvedAt: new Date()
        }, { returnDocument: 'after' });
    }
}

module.exports = new AlertRepository();
