// scripts/esp32-simulator.js
/**
 * Simulador del ESP32 — envía el MISMO payload que el firmware real a /api/v1/ingest.
 * Útil para la demo si el hardware falla, y como referencia del contrato.
 *
 * Uso:
 *   API_URL=http://localhost:3000/api/v1/ingest \
 *   DEVICE_ID=esp32-wear-01 API_KEY=<key-del-seed> \
 *   node scripts/esp32-simulator.js [--anomaly] [--interval=5000]
 *
 *   --anomaly   : simula una caída de SpO2 que dispara alertas
 *   --interval  : milisegundos entre envíos (default 5000)
 */
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1/ingest';
const DEVICE_ID = process.env.DEVICE_ID || 'esp32-wear-01';
const API_KEY = process.env.API_KEY;
const anomaly = process.argv.includes('--anomaly');
const intervalArg = process.argv.find((a) => a.startsWith('--interval='));
const INTERVAL = intervalArg ? Number(intervalArg.split('=')[1]) : 5000;

if (!API_KEY) {
    console.error('✗ Falta API_KEY. Usa la key impresa por scripts/seed.js');
    process.exit(1);
}

const isWearable = DEVICE_ID.includes('wear');
const rand = (min, max, dec = 1) => Number((Math.random() * (max - min) + min).toFixed(dec));
let tick = 0;

const buildReadings = () => {
    tick++;
    if (isWearable) {
        const spo2 = anomaly && tick >= 3 ? Math.max(84, 97 - tick * 3) : rand(94, 99, 0);
        return [
            { type: 'heart_rate', value: rand(60, 90, 0) },
            { type: 'spo2', value: spo2 },
            { type: 'body_temperature', value: rand(36.2, 37.0, 1) },
        ];
    }
    return [
        { type: 'co2', value: anomaly && tick >= 3 ? 2000 + tick * 500 : rand(500, 1200, 0) },
        { type: 'humidity', value: rand(40, 55, 0) },
        { type: 'ambient_temperature', value: rand(20, 23, 1) },
        { type: 'radiation_dose', value: rand(0.2, 0.6, 2) },
    ];
};

const send = async () => {
    const readings = buildReadings();
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-device-id': DEVICE_ID,
                'x-api-key': API_KEY,
            },
            body: JSON.stringify({ readings }),
        });
        const body = await res.json();
        console.log(`[${new Date().toISOString()}] ${res.status} →`, JSON.stringify(body));
    } catch (e) {
        console.error(`[${new Date().toISOString()}] ✗ ${e.message} (reintentando en ${INTERVAL}ms)`);
    }
};

console.log(`Simulador ${isWearable ? 'wearable' : 'cabina'} → ${API_URL} cada ${INTERVAL}ms ${anomaly ? '(MODO ANOMALÍA)' : ''}`);
send();
setInterval(send, INTERVAL);
