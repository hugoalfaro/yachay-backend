// api/diagnose.js
// Función serverless para Vercel (Node.js 18)

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

module.exports = async (req, res) => {
  // CORS para que pueda llamarse desde tu dominio victorhugoalfaro.com
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight de CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Comprobación rápida por GET (para probar en el navegador)
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      message: 'YACHAY backend está activo. Usa POST para enviar datos clínicos.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Usa POST.' });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: 'Falta la variable de entorno OPENROUTER_API_KEY en Vercel.'
    });
  }

  try {
    // Vercel ya parsea el body JSON en req.body
    const clinicalData = req.body;

    if (!clinicalData) {
      return res.status(400).json({ error: 'Falta el body JSON con los datos clínicos.' });
    }

    const prompt = `
Eres un asistente clínico experto en DSM-5-TR y CIE-11.
Evalúa los datos del paciente y genera un diagnóstico en formato JSON estricto.

DATOS DEL PACIENTE (JSON):
${JSON.stringify(clinicalData, null, 2)}

Responde SOLO en JSON con este formato exacto:

{
  "diagnosis": {
    "name": "Nombre del trastorno principal",
    "icd10": "Código CIE-10 o CIE-11 más cercano",
    "confidence": 0-100
  },
  "differential_diagnoses": [
    {
      "name": "Otro diagnóstico posible",
      "icd10": "Código",
      "confidence": 0-100
    }
  ],
  "explanation": "Explicación breve basada en los datos aportados",
  "recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ]
}
`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        // Opcionales pero recomendados por OpenRouter:
        'HTTP-Referer': 'https://victorhugoalfaro.com',
        'X-Title': 'YACHAY Backend'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un modelo clínico experto.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();
    // data.choices[0].message.content debería ser un JSON en texto
    let parsed = null;
    let rawText = '';

    if (data && data.choices && data.choices.length > 0) {
      rawText = data.choices[0].message.content || '';
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // Si no se puede parsear, devolvemos igual el texto crudo
        parsed = null;
      }
    }

    return res.status(200).json({
      success: true,
      parsed,     // JSON ya estructurado (si se pudo)
      rawText,    // texto original del modelo
      providerRaw: data // respuesta completa de OpenRouter (para debug)
    });

  } catch (err) {
    console.error('ERROR EN /api/diagnose:', err);
    return res.status(500).json({
      error: 'Internal backend error',
      detail: err.message || String(err)
    });
  }
};
