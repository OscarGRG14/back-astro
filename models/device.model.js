// models/device.model.js
const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Dispositivo de hardware registrado (ESP32 con sensores).
 * Autenticación: x-device-id + x-api-key (se almacena sha256 de la key).
 * 'wearable'    -> sensores corporales, asignado a un astronauta
 * 'environment' -> sensores de cabina, asignado a la misión
 */
const deviceSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        name: { type: String, trim: true, default: null },
        kind: {
            type: String,
            enum: ['wearable', 'environment'],
            required: true
        },
        apiKeyHash: { type: String, required: true, select: false },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        missionId: { type: String, default: 'MISSION-01', index: true },
        sensors: { type: [String], default: [] }, // tipos de métrica que reporta
        isActive: { type: Boolean, default: true },
        lastSeen: { type: Date, default: null }
    },
    { timestamps: true }
);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

deviceSchema.statics.generateApiKey = function () {
    return crypto.randomBytes(24).toString('hex');
};

deviceSchema.methods.verifyApiKey = function (plainKey) {
    return sha256(plainKey) === this.apiKeyHash;
};

const Device = mongoose.model('Device', deviceSchema);
Device.hashApiKey = sha256;

module.exports = Device;
