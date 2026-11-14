// routes/ingest.routes.js
const express = require('express');
const router = express.Router();
const { ingest } = require('../controllers/ingest.controller');
const { deviceAuth } = require('../middlewares/device-auth.middleware');

// Endpoint exclusivo para hardware (ESP32). Sin JWT — usa x-device-id + x-api-key.
router.post('/', deviceAuth, ingest);

module.exports = router;
