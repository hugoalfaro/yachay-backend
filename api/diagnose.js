// api/diagnose.js — versión estable para Vercel

module.exports = async (req, res) => {
  // Importar fetch dinámicamente (necesario en CommonJS + Vercel)
  const fetch = (await import('node-fetch')).default;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, msg: 'Diagnose API active' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }

  try {
    const clinical = req.body;

    const prompt = `
Eres un clínico experto. Evalúa el JSON del paciente estrictamente en formato JSON.

PACIENTE:
${JSON.stringify(clinical, null, 2)}

Responde SOLO en JSON así:
{
  "diagnosis": { "name": "", "icd10": "", "confidence": 0 },
  "differential_diagnoses": [],
  "explanation": "",
  "recommendations": []
}
`;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
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

    const data = await r.json();

    let raw = data?.choices?.[0]?.message?.content ?? "";
    let parsed = null;

    try { parsed = JSON.parse(raw); } catch (e) {}

    return res.status(200).json({
      ok: true,
      parsed,
      raw,
      provider: data
    });

  } catch (err) {
    return res.status(500).json({
      error: "Backend error",
      detail: err.message
    });
  }
};
