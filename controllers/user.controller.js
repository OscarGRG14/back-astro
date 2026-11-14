// controllers/user.controller.js
const asyncHandler = require('express-async-handler');
const userRepository = require('../repositories/user.repository');
const { isValidObjectId } = require('../utils/mongo.util');

// GET /users — todos los usuarios de la misión (medic/admin), filtrable por ?role=
const listUsers = asyncHandler(async (req, res) => {
    const filter = { isDeleted: false, missionId: req.user.missionId };
    if (req.query.role) filter.role = req.query.role;
    const users = await userRepository.find(filter, { sort: { createdAt: 1 } });
    res.json(users);
});

// GET /users/astronauts — lista de tripulación (medic/admin)
const listAstronauts = asyncHandler(async (req, res) => {
    const astronauts = await userRepository.findAstronauts(req.user.missionId);
    res.json(astronauts);
});

// GET /users/:id — perfil de un usuario de la misma misión
const getById = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    const user = await userRepository.findActiveById(req.params.id);
    if (!user || (req.user.role === 'astronaut' && String(user._id) !== String(req.user._id))) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
});

// PATCH /users/:id — admin edita datos, rol, baseline, estado y/o contraseña
const updateUser = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    const target = await userRepository.findById(req.params.id);
    if (!target || target.isDeleted) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { nombre, apellido, email, role, missionId, perfil, baseline, isActive, password } = req.body;

    if (email && email !== target.email) {
        const exists = await userRepository.findByEmail(email);
        if (exists) {
            return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
        }
        target.email = email;
    }

    if (password !== undefined) {
        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }
        target.password = password; // save() dispara el hash de bcrypt
    }

    if (nombre !== undefined) target.nombre = nombre;
    if (apellido !== undefined) target.apellido = apellido;
    if (role !== undefined) target.role = role;
    if (missionId !== undefined) target.missionId = missionId;
    if (perfil !== undefined) target.perfil = Object.assign({}, target.perfil, perfil);
    if (baseline !== undefined) target.baseline = Object.assign({}, target.baseline, baseline);
    if (isActive !== undefined) {
        // Evita que un admin se desactive a sí mismo
        if (isActive === false && String(target._id) === String(req.user._id)) {
            return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
        }
        target.isActive = isActive;
    }

    await target.save();
    res.json(target);
});

// DELETE /users/:id — soft delete (conserva historial de datos)
const deleteUser = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    if (String(req.params.id) === String(req.user._id)) {
        return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }

    const user = await userRepository.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
        isActive: false
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: `Usuario ${user.email} eliminado (soft delete)` });
});

module.exports = { listUsers, listAstronauts, getById, updateUser, deleteUser };
