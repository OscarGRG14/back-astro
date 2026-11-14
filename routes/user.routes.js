// routes/user.routes.js
const express = require('express');
const router = express.Router();
const { listUsers, listAstronauts, getById, updateUser, deleteUser } = require('../controllers/user.controller');
const { protect, requireRole } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/', requireRole('medic', 'admin'), listUsers);
router.get('/astronauts', requireRole('medic', 'admin'), listAstronauts);
router.patch('/:id', requireRole('admin'), updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);
router.get('/:id', getById);

module.exports = router;
