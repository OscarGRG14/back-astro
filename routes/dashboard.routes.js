// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const { summary, crew } = require('../controllers/dashboard.controller');
const { protect, requireRole } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/summary', summary);
router.get('/crew', requireRole('medic', 'admin'), crew);

module.exports = router;
