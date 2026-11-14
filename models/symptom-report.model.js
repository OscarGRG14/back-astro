// models/symptom-report.model.js
const mongoose = require('mongoose');

/** Diario de síntomas reportados por el astronauta. */
const symptomReportSchema = new mongoose.Schema(
    {
        astronaut: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        category: {
            type: String,
            enum: ['fisico', 'conductual', 'sueno', 'otro'],
            default: 'fisico'
        },
        description: { type: String, required: true, trim: true },
        severity: { type: Number, min: 1, max: 10, default: 5 },
        bodyArea: { type: String, trim: true, default: null },
        recordedAt: { type: Date, default: Date.now },
        missionId: { type: String, default: 'MISSION-01' }
    },
    { timestamps: true }
);

symptomReportSchema.index({ astronaut: 1, recordedAt: -1 });

module.exports = mongoose.model('SymptomReport', symptomReportSchema);
