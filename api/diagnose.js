// api/diagnose.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  
  // CORS para todas las respuestas
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Prueba rápida
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "YACHAY backend activo (ESM). Usa POST para diagnóstico."
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Falta OPENROUTER_API_KEY en Vercel."
    });
  }

  try {
    const clinicalData = req.body;

    const prompt = `
Eres un asistente clínico experto en DSM-5-TR y CIE-11.
Devuelve SOLO este JSON:

{
  "diagnosis": {
    "name": "",
    "icd10": "",
    "confidence": 0-100
  },
  "explanation": "",
  "recommendations": ["", ""]
}

DATOS:
${JSON.stringify(clinicalData, null, 2)}
`;

    // Llamada a OpenRouter
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://victorhugoalfaro.com",
        "X-Title": "YACHAY Backend"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un modelo clínico experto." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await aiResponse.json();

    let rawText = data?.choices?.[0]?.message?.content || "";
    let parsed = null;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }

    return res.status(200).json({
      success: true,
      parsed,
      rawText,
      providerRaw: data
    });

  } catch (err) {
    return res.status(500).json({
      error: "Error interno en diagnose.js",
      detail: err.message
    });
  }
}


