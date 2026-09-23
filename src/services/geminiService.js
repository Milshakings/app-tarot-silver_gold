// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');

export async function procesarLecturaTarot({ tipo, cartas, pregunta }) {
  if (!API_KEY) {
    throw new Error('No se ha configurado la API Key de Gemini en las variables de entorno.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
Eres un analista de tarot terapéutico y evolutivo de nivel experto.
Realiza una interpretación SINTÉTICA e INTEGRADA en conjunto de las 3 cartas seleccionadas.

NO analices las cartas por separado ni dividas la respuesta en secciones individuales para cada carta. Interpreta el significado dinámico que surge de la combinación e interacción global de las tres cartas.

Módulo: ${tipo}
Cartas seleccionadas: ${cartas.join(', ')}
${pregunta ? `Pregunta del usuario: "${pregunta}"` : ''}

Estructura tu respuesta en un formato JSON estricto con la siguiente propiedad principal:
{
  "analisis_conjunto": "Aquí entrega un análisis continuo, fluido y profundo que integre el mensaje holístico de las 3 cartas en conjunto, ofreciendo una perspectiva terapéutica clara."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    // Limpieza de formato markdown JSON si la IA lo devuelve envuelto en ```json
    const jsonLimpio = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonLimpio);
  } catch (error) {
    console.error('Error al consultar Gemini:', error);
    return {
      analisis_conjunto: "Ocurrió un inconveniente al procesar la lectura en conjunto. Por favor intenta de nuevo."
    };
  }
}
