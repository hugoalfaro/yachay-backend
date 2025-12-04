// api/diagnose.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Diagnose funcionando en Node.js CommonJS"
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Falta OPENROUTER_API_KEY"
    });
  }

  const clinicalData = req.body;

  const prompt = `
Eres un asistente clínico experto. Responde SOLO JSON válido:

{
  "diagnosis": { "name": "", "icd10": "", "confidence": 0 },
  "explanation": "",
  "recommendations": ["", ""]
}

DATOS:
${JSON.stringify(clinicalData, null, 2)}
`;

  try {
    const ai = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://victorhugoalfaro.com/yachay",
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

    const data = await ai.json();
    const rawText = data?.choices?.[0]?.message?.content || "";

    let parsed = null;
    try { parsed = JSON.parse(rawText); } catch {}

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
};
