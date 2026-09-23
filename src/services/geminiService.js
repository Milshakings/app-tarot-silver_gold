// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');

export async function procesarLecturaTarot({ tipo, cartas, pregunta }) {
  if (!API_KEY) {
    throw new Error('No se ha configurado la API Key de Gemini en las variables de entorno.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let prompt = '';

  if (tipo === 'triptico') {
    prompt = `
Eres un analista de tarot terapéutico y evolutivo experto.

Módulo: Tríptico de Consejos (Amor, Dinero/Trabajo y Salud/Bienestar)

Cartas seleccionadas por área:
- ❤️ Amor: ${cartas.amor[0]} y ${cartas.amor[1]}
- 💰 Dinero y Trabajo: ${cartas.dinero[0]} y ${cartas.dinero[1]}
- 🌿 Salud y Bienestar: ${cartas.salud[0]} y ${cartas.salud[1]}

Por favor entrega tu respuesta bien estructurada de la siguiente forma:

1. **ANÁLISIS POR TEMA (Consejos individuales por pareja de cartas):**
   - **❤️ Amor:** Análisis individual y consejo para la combinación de ${cartas.amor[0]} y ${cartas.amor[1]}.
   - **💰 Dinero y Trabajo:** Análisis individual y consejo para la combinación de ${cartas.dinero[0]} y ${cartas.dinero[1]}.
   - **🌿 Salud y Bienestar:** Análisis individual y consejo para la combinación de ${cartas.salud[0]} y ${cartas.salud[1]}.

2. **SÍNTESIS Y CONSEJO EN CONJUNTO:**
   Un análisis holístico e integrado que combine la guía de los 3 ámbitos (Amor, Dinero y Salud) ofreciendo una perspectiva y consejo general coherente para el consultante.

Responde de forma clara, directa y estructurada. No agregues bloques de código JSON.
`;
  } else {
    prompt = `
Eres un analista de tarot terapéutico y evolutivo experto.

Módulo de lectura: ${tipo}
Cartas seleccionadas:
- Carta 1: ${cartas[0]}
- Carta 2: ${cartas[1]}
- Carta 3: ${cartas[2]}
${pregunta ? `Pregunta del usuario: "${pregunta}"` : ''}

Por favor entrega tu respuesta en dos partes bien estructuradas:

1. **ANÁLISIS INDIVIDUAL DE CADA CARTA:**
Breve interpretación de lo que aporta cada una de las 3 cartas por separado a la situación (${cartas[0]}, ${cartas[1]} y ${cartas[2]}).

2. **ANÁLISIS Y SÍNTESIS EN CONJUNTO:**
Un análisis profundo e integrado de la combinación global de las 3 cartas interactuando juntas y ofreciendo una conclusión terapéutica clara.

Responde de forma clara, directa y estructurada. No agregues bloques de código JSON.
`;
  }

  try {
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    return textResponse;
  } catch (error) {
    console.error('Error al consultar Gemini:', error);
    return "No se pudo conectar con la API de Gemini. Revisa que la variable EXPO_PUBLIC_GEMINI_API_KEY esté configurada correctamente en Vercel.";
  }
}