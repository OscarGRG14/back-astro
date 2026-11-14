// models/mood-assessment.model.js
const mongoose = require('mongoose');

/**
 * Cuestionario de salud conductual.
 * instrument: 'PHQ9' (depresión), 'GAD7' (ansiedad), 'PSS' (estrés), 'CUSTOM'.
 * El score se evalúa contra las reglas de alert-rules.config.
 */
const moodAssessmentSchema = new mongoose.Schema(
    {
        astronaut: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        instrument: {
            type: String,
            enum: ['PHQ9', 'GAD7', 'PSS', 'CUSTOM'],
            required: true
        },
        score: { type: Number, required: true, min: 0 },
        answers: { type: [Number], default: [] },
        notes: { type: String, trim: true, default: null },
        recordedAt: { type: Date, default: Date.now },
        missionId: { type: String, default: 'MISSION-01' }
    },
    { timestamps: true }
);

moodAssessmentSchema.index({ astronaut: 1, instrument: 1, recordedAt: -1 });

module.exports = mongoose.model('MoodAssessment', moodAssessmentSchema);
