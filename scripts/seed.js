// scripts/seed.js
/**
 * Seed de datos demo para la presentación:
 *  - 1 admin, 1 médico (control de misión), 2 astronautas
 *  - 1 ESP32 wearable (asignado a astronauta 1) + 1 de cabina
 *  - 7 días de métricas, sueño, ejercicio y un cuestionario de ánimo
 *  - Incluye una anomalía de SpO2 que dispara una alerta
 *
 * Uso: node scripts/seed.js
 * ¡Imprime las API keys de los dispositivos — guárdalas para el firmware/simulador!
 */
require('../configs/env.config');
const mongoService = require('../configs/mongo.config');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Device = require('../models/device.model');
const Metric = require('../models/metric.model');
const SleepLog = require('../models/sleep-log.model');
const ExerciseLog = require('../models/exercise-log.model');
const MoodAssessment = require('../models/mood-assessment.model');

const MISSION = 'AURA-01';

const rand = (min, max, dec = 0) => Number((Math.random() * (max - min) + min).toFixed(dec));

async function seed() {
    await mongoService.connect();
    console.log('Limpiando datos demo anteriores (conservando usuarios ajenos al seed)...');
    const SEED_EMAILS = ['admin@astro.dev', 'medic@astro.dev', 'astro@astro.dev', 'astro2@astro.dev'];
    const db = mongoose.connection.db;
    // Borra usuarios del seed para re-crearlos, pero conserva usuarios creados
    // por otros medios (p. ej. npm run create:admin)
    await User.deleteMany({ email: { $in: SEED_EMAILS } });
    // Limpia colecciones de datos (métricas, dispositivos, alertas, etc.)
    const keepCollections = new Set(['users']);
    for (const c of await db.listCollections().toArray()) {
        if (!keepCollections.has(c.name)) await db.dropCollection(c.name);
    }

    // --- Usuarios ---
    const admin = await User.create({
        nombre: 'Commander', apellido: 'Ops', email: 'admin@astro.dev',
        password: 'admin123', role: 'admin', missionId: MISSION
    });
    const medic = await User.create({
        nombre: 'Valentina', apellido: 'Torres', email: 'medic@astro.dev',
        password: 'medic123', role: 'medic', missionId: MISSION
    });
    const astro1 = await User.create({
        nombre: 'Marco', apellido: 'Reyes', email: 'astro@astro.dev',
        password: 'astro123', role: 'astronaut', missionId: MISSION,
        perfil: { edad: 38, sexo: 'M', pesoKg: 78, alturaCm: 178 },
        baseline: { restingHeartRate: 62, spo2: 98, systolicBP: 118, diastolicBP: 76, bodyTemperature: 36.6 }
    });
    const astro2 = await User.create({
        nombre: 'Lucía', apellido: 'Fuentes', email: 'astro2@astro.dev',
        password: 'astro123', role: 'astronaut', missionId: MISSION,
        perfil: { edad: 34, sexo: 'F', pesoKg: 62, alturaCm: 165 },
        baseline: { restingHeartRate: 66, spo2: 98, systolicBP: 112, diastolicBP: 72, bodyTemperature: 36.5 }
    });

    // --- Dispositivos ---
    const wearableKey = Device.generateApiKey();
    const cabinKey = Device.generateApiKey();
    await Device.create([
        { deviceId: 'esp32-wear-01', name: 'Wearable Marco', kind: 'wearable',
          apiKeyHash: Device.hashApiKey(wearableKey), assignedTo: astro1._id, missionId: MISSION,
          sensors: ['heart_rate', 'spo2', 'body_temperature'] },
        { deviceId: 'esp32-cabin-01', name: 'Sensor cabina', kind: 'environment',
          apiKeyHash: Device.hashApiKey(cabinKey), missionId: MISSION,
          sensors: ['co2', 'humidity', 'ambient_temperature', 'radiation_dose'] },
    ]);

    // --- 7 días de métricas ---
    const metrics = [];
    const days = 7;
    for (let d = days; d >= 0; d--) {
        for (let h = 0; h < 24; h += 4) {
            const ts = new Date(Date.now() - d * 864e5 + h * 36e5);
            // Vitales astronauta 1 (con anomalía de SpO2 en el día 1)
            const spo2 = (d === 1 && h === 8) ? 89 : rand(94, 99);
            metrics.push(
                { astronaut: astro1._id, type: 'heart_rate', value: rand(58, 88), unit: 'bpm', scope: 'vital', source: 'device', missionId: MISSION, recordedAt: ts },
                { astronaut: astro1._id, type: 'spo2', value: spo2, unit: '%', scope: 'vital', source: 'device', missionId: MISSION, recordedAt: ts },
                { astronaut: astro1._id, type: 'body_temperature', value: rand(36.2, 37.2, 1), unit: '°C', scope: 'vital', source: 'device', missionId: MISSION, recordedAt: ts },
                // Ambiente
                { type: 'co2', value: rand(500, 1400), unit: 'ppm', scope: 'environment', source: 'device', missionId: MISSION, recordedAt: ts },
                { type: 'humidity', value: rand(40, 55), unit: '%', scope: 'environment', source: 'device', missionId: MISSION, recordedAt: ts },
                { type: 'radiation_dose', value: rand(0.3, 0.8, 2), unit: 'mSv', scope: 'environment', source: 'device', missionId: MISSION, recordedAt: ts },
            );
        }
    }
    await Metric.insertMany(metrics);

    // --- Sueño y ejercicio (7 días) ---
    const sleep = [], exercise = [];
    for (let d = 7; d >= 1; d--) {
        const date = new Date(Date.now() - d * 864e5);
        sleep.push({ astronaut: astro1._id, date, durationMinutes: rand(330, 450), quality: rand(2, 4), awakenings: rand(0, 3), missionId: MISSION });
        exercise.push({ astronaut: astro1._id, date, exerciseType: d % 2 ? 'resistencia' : 'aerobico', durationMinutes: rand(45, 90), intensity: 'moderada', missionId: MISSION });
    }
    await SleepLog.insertMany(sleep);
    await ExerciseLog.insertMany(exercise);

    // --- Cuestionario de ánimo (puntaje levemente elevado) ---
    await MoodAssessment.create({
        astronaut: astro1._id, instrument: 'PHQ9', score: 8,
        answers: [1, 1, 2, 1, 0, 1, 1, 1, 0],
        notes: 'Algo de fatiga por el horario de sueño alterado', missionId: MISSION
    });

    console.log(`
✓ Seed completado — misión ${MISSION}

Credenciales de prueba:
  admin:     admin@astro.dev / admin123
  medic:     medic@astro.dev / medic123
  astronaut: astro@astro.dev / astro123
  astronaut: astro2@astro.dev / astro123

Dispositivos (guardar para el firmware/simulador):
  ESP32 wearable (Marco):  x-device-id: esp32-wear-01   x-api-key: ${wearableKey}
  ESP32 cabina:            x-device-id: esp32-cabin-01  x-api-key: ${cabinKey}
`);

    await mongoService.disconnect();
    process.exit(0);
}

seed().catch((e) => { console.error('✗ Error en seed:', e); process.exit(1); });
