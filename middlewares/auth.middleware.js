// middlewares/auth.middleware.js
const { verifyToken } = require('../configs/jwt.config');
const userRepository = require('../repositories/user.repository');

/**
 * Autenticación por Bearer JWT.
 * Carga el usuario en req.user y valida que siga activo.
 */
const protect = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    try {
        const token = header.split(' ')[1];
        const payload = verifyToken(token);
        const user = await userRepository.findActiveById(payload.sub);

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado o desactivado' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

/**
 * Autorización por rol: requireRole('medic', 'admin')
 */
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'No tienes permisos para esta operación' });
    }
    next();
};

module.exports = { protect, requireRole };
