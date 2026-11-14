// controllers/auth.controller.js
const asyncHandler = require('express-async-handler');
const userRepository = require('../repositories/user.repository');
const { signToken } = require('../configs/jwt.config');

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// POST /auth/register — solo admin crea cuentas (astronautas, médicos)
const register = asyncHandler(async (req, res) => {
    const { nombre, apellido, email, password, role, missionId, perfil, baseline } = req.body;

    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({ message: 'nombre, apellido, email y password son obligatorios' });
    }

    const exists = await userRepository.findByEmail(email);
    if (exists) {
        return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }

    const user = await userRepository.create({
        nombre, apellido, email, password,
        role: role || 'astronaut',
        missionId, perfil, baseline,
        createdBy: req.user?._id || null
    });

    res.status(201).json(user);
});

// POST /auth/login
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'email y password son obligatorios' });
    }

    const user = await userRepository.findByEmail(email, { withPassword: true });
    if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    if (user.isLocked) {
        return res.status(423).json({ message: 'Cuenta bloqueada temporalmente. Intenta más tarde.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
        const attempts = (user.loginAttempts || 0) + 1;
        const lockUntil = attempts >= MAX_ATTEMPTS
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : null;
        await userRepository.incrementLoginAttempts(user._id, lockUntil);
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    await userRepository.recordLogin(user._id);

    const token = signToken({ sub: user._id.toString(), role: user.role, missionId: user.missionId });
    res.json({ token, user: { id: user._id, nombre: user.fullName, email: user.email, role: user.role, missionId: user.missionId } });
});

// GET /auth/me
const me = asyncHandler(async (req, res) => {
    res.json(req.user);
});

module.exports = { register, login, me };
