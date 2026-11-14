// models/metric.model.js
const mongoose = require('mongoose');
const { METRIC_TYPES } = require('../configs/metric-types.config');

/**
 * Métrica time-series: signos vitales del astronauta y ambiente de cabina.
 * source 'device' -> ingestada por ESP32; 'manual' -> ingresada por el usuario.
 */
const metricSchema = new mongoose.Schema(
    {
        astronaut: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },
        type: {
            type: String,
            required: true,
            enum: Object.keys(METRIC_TYPES)
        },
        value: { type: Number, required: true },
        unit: { type: String, required: true },
        scope: {
            type: String,
            enum: ['vital', 'environment'],
            required: true,
            index: true
        },
        source: {
            type: String,
            enum: ['device', 'manual'],
            required: true
        },
        device: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Device',
            default: null
        },
        missionId: { type: String, default: 'MISSION-01', index: true },
        recordedAt: { type: Date, default: Date.now, index: true }
    },
    { timestamps: true }
);

metricSchema.index({ astronaut: 1, type: 1, recordedAt: -1 });
metricSchema.index({ type: 1, recordedAt: -1 });

const Metric = mongoose.model('Metric', metricSchema);

module.exports = Metric;
