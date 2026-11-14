// middlewares/device-auth.middleware.js
const deviceRepository = require('../repositories/device.repository');

/**
 * Autenticación de dispositivos hardware (ESP32).
 * Headers requeridos: x-device-id, x-api-key
 */
const deviceAuth = async (req, res, next) => {
    const deviceId = req.headers['x-device-id'];
    const apiKey = req.headers['x-api-key'];

    if (!deviceId || !apiKey) {
        return res.status(401).json({ message: 'Headers x-device-id y x-api-key requeridos' });
    }

    try {
        const device = await deviceRepository.findByDeviceId(deviceId, { withKey: true });

        if (!device || !device.isActive || !device.verifyApiKey(apiKey)) {
            return res.status(401).json({ message: 'Dispositivo no autorizado' });
        }

        deviceRepository.touchLastSeen(deviceId).catch(() => {});
        req.device = device;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { deviceAuth };
