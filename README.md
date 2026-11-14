# AstroHealth API — NASA Space Apps Challenge

Backend de monitoreo de salud para astronautas en misiones de larga duración.
Signos vitales vía **ESP32** o entrada manual, ambiente de cabina, registros de
bienestar (sueño, ejercicio contramedida, salud conductual, síntomas), **motor
de alertas** por umbrales clínicos e **insights diarios con Gemini**.

## Stack
Express 5 · Mongoose · JWT · @google/genai (Gemini) · Swagger UI

## Arranque rápido

```bash
npm install
cp .env.example .env   # PORT, MONGO_URI, JWT_SECRET, GEMINI_API_KEY...
npm run seed           # datos demo + imprime API keys de los ESP32
npm run dev            # http://localhost:3000
```

Docs interactivas: **http://localhost:3000/api/docs**

## Roles
| Rol | Acceso |
|---|---|
| `astronaut` | Sus propios datos, registros, alertas, insights |
| `medic` | Toda la tripulación, ack de alertas |
| `admin` | + registro de usuarios y dispositivos |

## Ingesta ESP32

```
POST /api/v1/ingest
Headers: x-device-id, x-api-key
{ "readings": [ { "type": "heart_rate", "value": 78, "ts": "..." } ] }
```

Tipos válidos: `heart_rate, spo2, blood_pressure_*, body_temperature,
respiration_rate` (vitales) · `co2, humidity, ambient_temperature,
radiation_dose` (ambiente). Ver `configs/metric-types.config.js`.

### Firmware (referencia, Arduino/ESP32)

```cpp
http.begin("http://<server>:3000/api/v1/ingest");
http.addHeader("Content-Type", "application/json");
http.addHeader("x-device-id", "esp32-wear-01");
http.addHeader("x-api-key", API_KEY);
http.POST("{\"readings\":[{\"type\":\"spo2\",\"value\":96}]}");
// Buffer local + reintento: tolera ventanas sin conectividad
```

## Simulador (backup de demo sin hardware)

```bash
DEVICE_ID=esp32-wear-01 API_KEY=<key> npm run simulate:wearable
# modo anomalía (baja SpO2 → dispara alertas):
node scripts/esp32-simulator.js --anomaly --interval=3000
```

## Estructura

```
configs/      env, jwt, mongo, catálogo de métricas, reglas de alertas
models/       User, Device, Metric, Sleep/Exercise/Mood/Symptom, Alert, Insight
repositories/ BaseRepository + un repo por dominio
services/     metric, alert (motor de reglas), gemini, insight, dashboard
middlewares/  JWT auth, device API key, errores
routes/       /api/v1/{auth,users,devices,ingest,metrics,alerts,insights,dashboard,records}
scripts/      seed.js, esp32-simulator.js
docs/         openapi.json → /api/docs
```
