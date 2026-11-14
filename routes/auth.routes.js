// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/auth.controller');
const { protect, requireRole } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/register', protect, requireRole('admin'), register);
router.get('/me', protect, me);

module.exports = router;
