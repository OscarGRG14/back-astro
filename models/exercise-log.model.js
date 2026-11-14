// models/exercise-log.model.js
const mongoose = require('mongoose');

/**
 * Registro de ejercicio contramedida (mitiga pérdida ósea y muscular
 * por microgravedad; p. ej. resistencia tipo ARED o aeróbico tipo treadmill).
 */
const exerciseLogSchema = new mongoose.Schema(
    {
        astronaut: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: Date, required: true },
        exerciseType: {
            type: String,
            enum: ['resistencia', 'aerobico', 'fuerza', 'movilidad', 'otro'],
            required: true
        },
        durationMinutes: { type: Number, required: true, min: 1 },
        intensity: {
            type: String,
            enum: ['baja', 'moderada', 'alta'],
            default: 'moderada'
        },
        notes: { type: String, trim: true, default: null },
        missionId: { type: String, default: 'MISSION-01' }
    },
    { timestamps: true }
);

exerciseLogSchema.index({ astronaut: 1, date: -1 });

module.exports = mongoose.model('ExerciseLog', exerciseLogSchema);
