// routes/record.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/records.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/sleep', ctrl.createSleep);
router.get('/sleep', ctrl.listSleep);

router.post('/exercise', ctrl.createExercise);
router.get('/exercise', ctrl.listExercise);

router.post('/mood', ctrl.createMood);
router.get('/mood', ctrl.listMood);

router.post('/symptoms', ctrl.createSymptom);
router.get('/symptoms', ctrl.listSymptoms);

module.exports = router;
