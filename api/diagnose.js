export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { clinicalData } = req.body;

    if (!clinicalData) {
      return res.status(400).json({ error: "Missing clinicalData" });
    }

    const prompt = `
Eres un psicólogo clínico experto. Analiza estos datos y devuelve diagnóstico en JSON estricto.

Datos:
${JSON.stringify(clinicalData, null, 2)}

Responde SOLO en formato JSON con:
{
  "diagnosis": {
    "name": "",
    "icd10": "",
    "confidence": 0
  },
  "explanation": "",
  "recommendations": []
}
    `;

    const openrouterKey = process.env.OPENROUTER_API_KEY;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      raw: data,
      diagnosis: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (e) {
    console.error("Backend error:", e);
    res.status(500).json({ error: "Server error", detail: e.toString() });
  }
}
