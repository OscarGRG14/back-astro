// repositories/user.repository.js
const User = require('../models/user.model');
const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    findByEmail(email, { withPassword = false } = {}) {
        const query = this.model.findOne({ email, isDeleted: false });
        return withPassword ? query.select('+password') : query;
    }

    findActiveById(id) {
        return this.model.findOne({ _id: id, isActive: true, isDeleted: false });
    }

    findAstronauts(missionId) {
        return this.model.find({ role: 'astronaut', isActive: true, isDeleted: false, ...(missionId && { missionId }) });
    }

    recordLogin(id) {
        return this.model.findByIdAndUpdate(id, {
            lastLogin: new Date(),
            loginAttempts: 0,
            lockUntil: null
        });
    }

    incrementLoginAttempts(id, lockUntil = null) {
        return this.model.findByIdAndUpdate(id, {
            $inc: { loginAttempts: 1 },
            ...(lockUntil && { lockUntil })
        });
    }
}

module.exports = new UserRepository();
