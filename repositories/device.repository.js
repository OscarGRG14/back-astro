// repositories/device.repository.js
const Device = require('../models/device.model');
const BaseRepository = require('./base.repository');

class DeviceRepository extends BaseRepository {
    constructor() {
        super(Device);
    }

    findByDeviceId(deviceId, { withKey = false } = {}) {
        const query = this.model.findOne({ deviceId });
        return withKey ? query.select('+apiKeyHash') : query;
    }

    touchLastSeen(deviceId) {
        return this.model.updateOne({ deviceId }, { lastSeen: new Date() });
    }
}

module.exports = new DeviceRepository();
