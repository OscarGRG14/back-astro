// routes/metric.routes.js
const express = require('express');
const router = express.Router();
const { createManual, history, latest } = require('../controllers/metric.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/', createManual);
router.get('/', history);
router.get('/latest', latest);

module.exports = router;
