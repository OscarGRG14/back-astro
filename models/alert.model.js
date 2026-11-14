// models/alert.model.js
const mongoose = require('mongoose');

/**
 * Alerta generada por el motor de reglas.
 * astronaut puede ser null (alertas de ambiente/misión).
 * status: active -> acknowledged -> resolved.
 */
const alertSchema = new mongoose.Schema(
    {
        astronaut: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        ruleKey: { type: String, required: true },
        severity: { type: String, enum: ['info', 'warning', 'critical'], required: true, index: true },
        message: { type: String, required: true },
        metricType: { type: String, default: null },
        metricValue: { type: Number, default: null },
        source: { type: String, enum: ['rule_engine', 'mood_assessment', 'radiation', 'manual'], default: 'rule_engine' },
        status: { type: String, enum: ['active', 'acknowledged', 'resolved'], default: 'active', index: true },
        acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        acknowledgedAt: { type: Date, default: null },
        resolvedAt: { type: Date, default: null },
        missionId: { type: String, default: 'MISSION-01', index: true }
    },
    { timestamps: true }
);

alertSchema.index({ astronaut: 1, ruleKey: 1, status: 1 });
alertSchema.index({ status: 1, severity: -1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
