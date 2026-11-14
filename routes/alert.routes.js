// routes/alert.routes.js
const express = require('express');
const router = express.Router();
const { list, acknowledge, resolve } = require('../controllers/alert.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/', list);
router.patch('/:id/acknowledge', acknowledge);
router.patch('/:id/resolve', resolve);

module.exports = router;
