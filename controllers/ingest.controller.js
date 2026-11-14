// controllers/ingest.controller.js
const asyncHandler = require('express-async-handler');
const metricService = require('../services/metric.service');

/**
 * POST /ingest — endpoint del ESP32 (auth por x-device-id + x-api-key).
 * Body: { readings: [{ type, value, ts? }, ...] }
 */
const ingest = asyncHandler(async (req, res) => {
    const result = await metricService.ingestReadings(req.device, req.body.readings);
    res.status(201).json(result);
});

module.exports = { ingest };
