// routes/routes.js
const express = require('express');
const router = express.Router();

// Health check del servicio
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'back-astro' }));

router.use('/v1/auth', require('./auth.routes'));
router.use('/v1/users', require('./user.routes'));
router.use('/v1/devices', require('./device.routes'));
router.use('/v1/ingest', require('./ingest.routes'));
router.use('/v1/metrics', require('./metric.routes'));
router.use('/v1/alerts', require('./alert.routes'));
router.use('/v1/insights', require('./insight.routes'));
router.use('/v1/dashboard', require('./dashboard.routes'));
router.use('/v1/records', require('./record.routes'));

module.exports = router;
