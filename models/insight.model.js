// models/insight.model.js
const mongoose = require('mongoose');

/** Insight generado por IA (Gemini) a partir del contexto de salud del astronauta. */
const insightSchema = new mongoose.Schema(
    {
        astronaut: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        period: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
        content: {
            summary: { type: String, default: null },
            riskLevel: { type: String, enum: ['bajo', 'moderado', 'alto', 'critico'], default: null },
            recommendations: { type: [String], default: [] },
            focusAreas: { type: [String], default: [] }
        },
        dataWindow: {
            from: { type: Date, default: null },
            to: { type: Date, default: null }
        },
        model: { type: String, default: null },
        generatedAt: { type: Date, default: Date.now },
        missionId: { type: String, default: 'MISSION-01' }
    },
    { timestamps: true }
);

insightSchema.index({ astronaut: 1, period: 1, generatedAt: -1 });

module.exports = mongoose.model('Insight', insightSchema);
