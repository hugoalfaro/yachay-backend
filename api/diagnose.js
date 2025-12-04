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

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Falta variable OPENROUTER_API_KEY",
    });
  }

  try {
    const prompt = `
Eres un asistente clínico experto. Responde SOLO en JSON limpio.
DATOS:
${JSON.stringify(req.body)}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un modelo clínico experto." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const providerRaw = await response.json();

    // 🔥 Log completo para debug
    console.log("OPENROUTER RAW RESPONSE:", providerRaw);

    let rawText =
      providerRaw?.choices?.[0]?.message?.content || "";

    let parsed = null;

    try {
      parsed = JSON.parse(rawText);
    } catch {}

    return res.status(200).json({
      parsed,
      rawText,
      providerRaw,  // <---- LO NECESITO PARA VER POR QUÉ FALLA
    });

  } catch (err) {
    console.error("ERROR BACKEND:", err);
    return res.status(500).json({
      error: "Exception in backend",
      detail: err.message,
    });
  }
}

