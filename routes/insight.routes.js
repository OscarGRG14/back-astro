// routes/insight.routes.js
const express = require('express');
const router = express.Router();
const { daily, generate } = require('../controllers/insight.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/daily', daily);
router.post('/generate', generate);

module.exports = router;
