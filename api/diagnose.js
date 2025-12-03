export default async function handler(req, res) {
  try {
    const body = await req.json();

    const prompt = `
Eres un asistente clínico experto en DSM-5 y CIE-10.
Evalúa los datos del paciente y genera un diagnóstico en formato JSON estricto.

DATOS DEL PACIENTE:
${JSON.stringify(body, null, 2)}

Responde SOLO en JSON con:
{
  "diagnosis": {
    "name": "",
    "icd10": "",
    "confidence": 0
  },
  "explanation": "",
  "recommendations": []
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
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

    const data = await response.json();
    console.log("RAW RESPONSE:", data);

    return res.status(200).json({
      success: true,
      raw: data
    });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: "Internal backend error", detail: err.message });
  }
}
