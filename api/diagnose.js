// api/diagnose.js
import fetch from "node-fetch";

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "YACHAY backend activo. Usa POST."
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "Falta la variable OPENROUTER_API_KEY en Vercel"
    });
  }

  const body = req.body;

  const prompt = `
Eres un asistente clínico experto. Evalúa los siguientes datos y responde SOLO en JSON:

{
  "diagnosis": {
    "name": "",
    "icd10": "",
    "confidence": 0-100
  },
  "explanation": "",
  "recommendations": ["", ""]
}

DATOS DEL PACIENTE:
${JSON.stringify(body)}
`;

  try {
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un modelo clínico experto." },
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await aiResponse.json();

    let raw = json?.choices?.[0]?.message?.content || "";
    let parsed = null;

    try { parsed = JSON.parse(raw); } catch(e) {}

    return res.status(200).json({
      parsed,
      rawText: raw,
      providerRaw: json
    });

  } catch (err) {
    return res.status(500).json({
      error: "Backend error",
      detail: err.message
    });
  }
}

