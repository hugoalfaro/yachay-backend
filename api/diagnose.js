// api/diagnose.js
import fetch from "node-fetch";

// Handler compatible con Vercel (Node 18)
export default async function handler(req, res) {

  // CORS permitido para cualquier origen
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Test de conexión (GET)
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "YACHAY backend está activo. Usa POST para diagnóstico."
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "Falta OPENROUTER_API_KEY en variables de entorno de Vercel."
    });
  }

  try {
    const clinicalData = req.body;

    const prompt = `
Eres un asistente clínico experto en DSM-5-TR y CIE-11.
Evalúa estos datos y devuelve SOLO un JSON estricto:

{
  "diagnosis": {
    "name": "",
    "icd10": "",
    "confidence": 0-100
  },
  "explanation": "",
  "recommendations": ["", ""]
}

Datos:
${JSON.stringify(clinicalData, null, 2)}
`;

    // Llamada a OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://victorhugoalfaro.com",
        "X-Title": "YACHAY Backend"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un asistente clínico." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    let rawText = data?.choices?.[0]?.message?.content || "";
    let parsed = null;

    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      parsed = null;
    }

    // Respuesta al front
    return res.status(200).json({
      success: true,
      parsed,
      rawText,
      providerRaw: data
    });

  } catch (err) {
    console.error("ERROR EN /api/diagnose:", err);
    return res.status(500).json({
      error: "Error interno en backend",
      detail: err.message
    });
  }
}


