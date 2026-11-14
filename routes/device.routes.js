// routes/device.routes.js
const express = require('express');
const router = express.Router();
const { registerDevice, listDevices, updateDevice, rotateApiKey, deleteDevice } = require('../controllers/device.controller');
const { protect, requireRole } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/', requireRole('admin'), registerDevice);
router.get('/', requireRole('admin', 'medic'), listDevices);
router.patch('/:id', requireRole('admin'), updateDevice);
router.post('/:id/rotate-key', requireRole('admin'), rotateApiKey);
router.delete('/:id', requireRole('admin'), deleteDevice);

module.exports = router;
