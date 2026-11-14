// models/sleep-log.model.js
const mongoose = require('mongoose');

/** Registro de sueño del astronauta (entrada manual o wearable futuro). */
const sleepLogSchema = new mongoose.Schema(
    {
        astronaut: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: Date, required: true },
        durationMinutes: { type: Number, required: true, min: 0, max: 1440 },
        quality: { type: Number, min: 1, max: 5, default: null }, // 1 = muy mala, 5 = excelente
        awakenings: { type: Number, min: 0, default: 0 },
        notes: { type: String, trim: true, default: null },
        missionId: { type: String, default: 'MISSION-01' }
    },
    { timestamps: true }
);

sleepLogSchema.index({ astronaut: 1, date: -1 });

module.exports = mongoose.model('SleepLog', sleepLogSchema);
