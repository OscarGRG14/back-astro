// repositories/insight.repository.js
const Insight = require('../models/insight.model');
const BaseRepository = require('./base.repository');

class InsightRepository extends BaseRepository {
    constructor() {
        super(Insight);
    }

    findLatest(astronaut, period = 'daily') {
        return this.model.findOne({ astronaut, period }).sort({ generatedAt: -1 });
    }

    /** Insight generado el mismo día UTC (para reutilizar sin gastar cuota de IA). */
    findToday(astronaut, period = 'daily') {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        return this.model.findOne({ astronaut, period, generatedAt: { $gte: start } })
            .sort({ generatedAt: -1 });
    }
}

module.exports = new InsightRepository();
