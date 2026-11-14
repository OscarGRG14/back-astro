// controllers/device.controller.js
const asyncHandler = require('express-async-handler');
const Device = require('../models/device.model');
const deviceRepository = require('../repositories/device.repository');

// POST /devices — admin registra un ESP32. Devuelve la apiKey UNA sola vez.
const registerDevice = asyncHandler(async (req, res) => {
    const { deviceId, name, kind, assignedTo, missionId, sensors } = req.body;

    if (!deviceId || !kind) {
        return res.status(400).json({ message: 'deviceId y kind (wearable|environment) son obligatorios' });
    }
    if (kind === 'wearable' && !assignedTo) {
        return res.status(400).json({ message: 'Un dispositivo wearable requiere assignedTo (astronauta)' });
    }

    const exists = await deviceRepository.findByDeviceId(deviceId);
    if (exists) {
        return res.status(409).json({ message: 'Ya existe un dispositivo con ese deviceId' });
    }

    const apiKey = Device.generateApiKey();
    const device = await deviceRepository.create({
        deviceId, name, kind,
        apiKeyHash: Device.hashApiKey(apiKey),
        assignedTo: assignedTo || null,
        missionId: missionId || req.user.missionId,
        sensors: sensors || []
    });

    res.status(201).json({
        device: { id: device._id, deviceId: device.deviceId, kind: device.kind, missionId: device.missionId },
        apiKey,
        note: 'Guarda esta apiKey en el firmware del ESP32 — no se puede recuperar.'
    });
});

// GET /devices — lista de dispositivos de la misión
const listDevices = asyncHandler(async (req, res) => {
    const devices = await deviceRepository.find({ missionId: req.user.missionId });
    res.json(devices);
});

// PATCH /devices/:id — actualizar nombre, kind, asignación, sensores, estado
const updateDevice = asyncHandler(async (req, res) => {
    const { name, kind, assignedTo, sensors, isActive } = req.body;

    if (kind === 'wearable' && assignedTo === null) {
        return res.status(400).json({ message: 'Un wearable requiere assignedTo' });
    }

    const update = {};
    if (name !== undefined) update.name = name;
    if (kind !== undefined) update.kind = kind;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (sensors !== undefined) update.sensors = sensors;
    if (isActive !== undefined) update.isActive = isActive;

    const device = await deviceRepository.findByIdAndUpdate(req.params.id, update);
    if (!device) return res.status(404).json({ message: 'Dispositivo no encontrado' });
    res.json(device);
});

// POST /devices/:id/rotate-key — regenera la API key (la vieja deja de funcionar)
const rotateApiKey = asyncHandler(async (req, res) => {
    const apiKey = Device.generateApiKey();
    const device = await deviceRepository.findByIdAndUpdate(req.params.id, {
        apiKeyHash: Device.hashApiKey(apiKey)
    });
    if (!device) return res.status(404).json({ message: 'Dispositivo no encontrado' });
    res.json({ apiKey, deviceId: device.deviceId, note: 'Key anterior revocada. Guarda esta — no se puede recuperar.' });
});

// DELETE /devices/:id — eliminar dispositivo
const deleteDevice = asyncHandler(async (req, res) => {
    const device = await deviceRepository.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ message: 'Dispositivo no encontrado' });
    res.json({ message: `Dispositivo ${device.deviceId} eliminado` });
});

module.exports = { registerDevice, listDevices, updateDevice, rotateApiKey, deleteDevice };
