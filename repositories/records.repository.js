// repositories/records.repository.js
/**
 * Repositorios para los registros de bienestar (entrada manual del astronauta).
 * Instancias de BaseRepository por modelo — comparten la misma interfaz CRUD.
 */
const BaseRepository = require('./base.repository');
const SleepLog = require('../models/sleep-log.model');
const ExerciseLog = require('../models/exercise-log.model');
const MoodAssessment = require('../models/mood-assessment.model');
const SymptomReport = require('../models/symptom-report.model');

module.exports = {
    sleep: new BaseRepository(SleepLog),
    exercise: new BaseRepository(ExerciseLog),
    mood: new BaseRepository(MoodAssessment),
    symptom: new BaseRepository(SymptomReport),
};
