// repositories/metric.repository.js
const Metric = require('../models/metric.model');
const BaseRepository = require('./base.repository');

class MetricRepository extends BaseRepository {
    constructor() {
        super(Metric);
    }

    history({ astronaut, type, scope, missionId, from, to, limit = 200 }) {
        const filter = {};
        if (astronaut) filter.astronaut = astronaut;
        if (type) filter.type = type;
        if (scope) filter.scope = scope;
        if (missionId) filter.missionId = missionId;
        if (from || to) {
            filter.recordedAt = {};
            if (from) filter.recordedAt.$gte = new Date(from);
            if (to) filter.recordedAt.$lte = new Date(to);
        }
        return this.model.find(filter).sort({ recordedAt: -1 }).limit(limit);
    }

    /** Última lectura de cada tipo para un astronauta (o de ambiente de la misión). */
    latestByScope({ astronaut, scope = 'vital', missionId }) {
        const match = scope === 'vital'
            ? { astronaut, scope }
            : { scope, missionId };
        return this.model.aggregate([
            { $match: match },
            { $sort: { recordedAt: -1 } },
            {
                $group: {
                    _id: '$type',
                    value: { $first: '$value' },
                    unit: { $first: '$unit' },
                    recordedAt: { $first: '$recordedAt' },
                    source: { $first: '$source' }
                }
            },
            { $project: { _id: 0, type: '$_id', value: 1, unit: 1, recordedAt: 1, source: 1 } }
        ]);
    }

    /** Resumen avg/min/max/count por tipo dentro de una ventana de tiempo. */
    summaryInWindow({ astronaut, scope, missionId, from, to }) {
        const match = { recordedAt: { $gte: new Date(from), $lte: new Date(to) } };
        if (astronaut) match.astronaut = astronaut;
        if (scope) match.scope = scope;
        if (missionId) match.missionId = missionId;
        return this.model.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$type',
                    avg: { $avg: '$value' },
                    min: { $min: '$value' },
                    max: { $max: '$value' },
                    count: { $sum: 1 },
                    unit: { $first: '$unit' }
                }
            },
            { $project: { _id: 0, type: '$_id', avg: { $round: ['$avg', 2] }, min: 1, max: 1, count: 1, unit: 1 } }
        ]);
    }

    sumType({ type, missionId, from, to }) {
        const match = { type, missionId };
        if (from || to) {
            match.recordedAt = {};
            if (from) match.recordedAt.$gte = new Date(from);
            if (to) match.recordedAt.$lte = new Date(to);
        }
        return this.model.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: '$value' } } }
        ]).then((r) => r[0]?.total || 0);
    }
}

module.exports = new MetricRepository();
