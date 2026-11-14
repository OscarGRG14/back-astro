// services/gemini.service.js
const { GoogleGenAI } = require('@google/genai');
const { env } = require('../configs/env.config');

/**
 * Cliente Gemini para generar insights de salud.
 * Devuelve JSON estructurado: { summary, riskLevel, recommendations[], focusAreas[] }
 */
const ai = env.gemini.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: env.gemini.GEMINI_API_KEY,
        httpOptions: { apiVersion: 'v1beta' }
    })
    : null;

const SYSTEM_PROMPT = `Eres un asistente médico de vuelo espacial (flight surgeon AI) para misiones de larga duración.
Analizas datos de salud de astronautas expuestos a radiación, microgravedad, aislamiento y ambiente cerrado.
Riesgos conocidos: cambios inmunes, pérdida ósea/muscular, eventos cardiovasculares, problemas de salud conductual.
El astronauta se auto-monitorea: tus recomendaciones deben ser ACCIONABLES por él mismo, en contexto de misión
(sin hospital, recursos limitados, con contramedidas disponibles: ejercicio resistivo/aeróbico, higiene de sueño,
comunicación con control de misión, medicación a bordo).
Responde SOLO con JSON válido con esta forma exacta:
{
  "summary": "resumen del estado general en 2-3 oraciones",
  "riskLevel": "bajo|moderado|alto|critico",
  "recommendations": ["acción concreta 1", "acción concreta 2", ...],
  "focusAreas": ["area a vigilar 1", ...]
}`;

const isAvailable = () => Boolean(ai);

const generateHealthInsight = async (context) => {
    if (!ai) {
        throw Object.assign(new Error('GEMINI_API_KEY no configurada'), { status: 503 });
    }

    const prompt = `${SYSTEM_PROMPT}\n\nDatos del astronauta (últimas ${context.windowHours}h):\n${JSON.stringify(context, null, 2)}`;

    const response = await ai.models.generateContent({
        model: env.gemini.GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const text = response.text.replace(/```json|```/g, '').trim();
    try {
        return { content: JSON.parse(text), model: env.gemini.GEMINI_MODEL };
    } catch {
        throw new Error(`Respuesta no-JSON de Gemini: ${text.slice(0, 200)}`);
    }
};

module.exports = { generateHealthInsight, isAvailable };
