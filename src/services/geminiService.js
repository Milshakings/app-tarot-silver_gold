// src/services/geminiService.js

// Clave de API leída desde las variables de entorno de Expo/Vercel
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

/**
 * Módulo de Fallback Local
 * Genera análisis analíticos dinámicos cuando la API no está disponible o falla.
 */
function generarLecturaMock(payload) {
  const { tipo, cartas, pregunta } = payload;
  const c1 = cartas && cartas[0] ? cartas[0].nombre || cartas[0] : 'Arcano I';
  const c2 = cartas && cartas[1] ? cartas[1].nombre || cartas[1] : 'Arcano II';
  const c3 = cartas && cartas[2] ? cartas[2].nombre || cartas[2] : 'Arcano III';

  switch (tipo) {
    case 'sensacion':
      return {
        sensacion_general: `Integración reflexiva impulsada por ${c1}. Se percibe un ciclo de renovación interna donde las tensiones cotidianas encuentran espacio para la claridad.`,
        mecanismos_cuidado: `Prioriza pausas de respiración y descanso activo. La influencia de ${c1} sugiere conectar con espacios de calma antes de tomar decisiones impulsivas.`,
        foco_atencion: `Atención consciente a los patrones emocionales presentes. Observa tus reacciones sin juzgar.`
      };

    case 'gratitud':
      return {
        reconocimiento: `Agradecimiento a las lecciones manifestadas a través de ${c1}, reconociendo el crecimiento alcanzado en la jornada.`,
        aprendizaje: `Aceptación de los procesos de cambio. La energía de ${c1} invita a valorar tanto los logros como los desafíos superados.`,
        integracion: `Sostener una actitud de apertura y presencia plena en las relaciones y proyectos actuales.`
      };

    case 'triptico':
      return {
        pasado: `Fase de cimentación e influencias previas representadas por ${c1}, sentando las bases del panorama actual.`,
        presente: `Momento de evaluación y acción bajo la energía de ${c2}, demandando atención a los detalles inmediatos.`,
        futuro: `Proyección armónica marcada por ${c3}, orientando el camino hacia el desarrollo personal y la estabilidad.`
      };

    case 'terapeutica': {
      const pregLimpia = pregunta && pregunta.trim() !== '' ? pregunta : 'Tu inquietud planteada';
      return {
        pregunta_reflexion: `Análisis Terapéutico sobre "${pregLimpia}":\n\n` +
          `• Lectura e Integración de Arcanos (${c1}, ${c2}, ${c3}):\n` +
          `Las cartas señalan una dinámica de transformación activa. La presencia de ${c1} invita a examinar la causa origen, mientras que ${c2} refleja el desafío central a trabajar en el presente. Por su parte, ${c3} proyecta la integración necesaria para avanzar de forma consciente.\n\n` +
          `• Orientación de Phronesis:\n` +
          `Observa qué aspectos de esta situación puedes gestionar directamente y cuáles requieren aceptación. La clave reside en mantener la claridad de tus valores sin precipitar conclusiones.`
      };
    }

    default:
      return {
        resumen: `Lectura general basada en los arcanos seleccionados: ${c1}, ${c2}, ${c3}.`
      };
  }
}

/**
 * Función Principal: Procesar Lectura de Tarot con Gemini REST API
 * @param {Object} payload - Contiene tipo ('sensacion'|'gratitud'|'triptico'|'terapeutica'), cartas y pregunta opcional.
 */
export async function procesarLecturaTarot(payload) {
  const { tipo, cartas, pregunta } = payload;

  // Si no hay API Key configurada, se recurre directamente al fallback local
  if (!API_KEY) {
    console.warn('⚠️ EXPO_PUBLIC_GEMINI_API_KEY no detectada. Generando respuesta local...');
    return generarLecturaMock(payload);
  }

  let prompt = '';

  switch (tipo) {
    case 'sensacion':
      prompt = `
        Actúa como un experto analista de tarot y consultor de bienestar transpersonal.
        Analiza las siguientes 3 cartas seleccionadas: ${JSON.stringify(cartas)}.
        Proporciona un diagnóstico breve sobre el estado emocional o mental.
        Responde ÚNICAMENTE un objeto JSON válido con este formato:
        {
          "sensacion_general": "Breve descripción de la energía o sensación global",
          "mecanismos_cuidado": "Consejo práctico para el autocuidado diario",
          "foco_atencion": "Aspecto central en el que conviene enfocar la atención hoy"
        }
      `;
      break;

    case 'gratitud':
      prompt = `
        Actúa como mentor de desarrollo personal y tarotista reflexivo.
        Analiza las siguientes 3 cartas seleccionadas: ${JSON.stringify(cartas)}.
        Enfoca la lectura hacia la gratitud y la apreciación consciente.
        Responde ÚNICAMENTE un objeto JSON válido con este formato:
        {
          "reconocimiento": "Aspecto o logro a agradecer según las cartas",
          "aprendizaje": "Lección valiosa extraída de la combinación",
          "integracion": "Cómo integrar este agradecimiento en la rutina diaria"
        }
      `;
      break;

    case 'triptico':
      prompt = `
        Actúa como tarotista analítico tradicional.
        Realiza una lectura temporal basada en las 3 cartas seleccionadas: ${JSON.stringify(cartas)}.
        Carta 1 = Pasado / Antecedentes.
        Carta 2 = Presente / Situación Actual.
        Carta 3 = Futuro / Tendencia.
        Responde ÚNICAMENTE un objeto JSON válido con este formato:
        {
          "pasado": "Análisis del origen o antecedentes",
          "presente": "Análisis del estado actual y desafíos",
          "futuro": "Tendencia proyectada o recomendación de avance"
        }
      `;
      break;

    case 'terapeutica':
      prompt = `
        Actúa como terapeuta transpersonal, mentor de introspección y analista de tarot.
        El usuario plantea la siguiente PREGUNTA ABIERTA O INQUIETUD: "${pregunta || 'Consulta de orientación general'}".
        Las 3 cartas seleccionadas como guía son: ${JSON.stringify(cartas)}.

        Entrega una respuesta analítica, empática y abierta (SIN limitar a SÍ/NO). 
        Estructura la respuesta de forma clara abarcando:
        1. Análisis integrado de los 3 arcanos en relación a la pregunta planteada.
        2. Reflexión o consejo terapéutico práctico para la toma de decisiones.

        Responde ÚNICAMENTE un objeto JSON válido con el formato:
        {
          "pregunta_reflexion": "Texto completo del análisis e integración terapéutica"
        }
      `;
      break;

    default:
      prompt = `Analiza las cartas ${JSON.stringify(cartas)} y entrega un breve resumen reflexivo en un JSON con la propiedad "resumen".`;
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error en respuesta Gemini API: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Estructura de respuesta inválida desde Gemini API');
    }

    // Limpieza de formato Markdown si el modelo retorna etiquetas ```json
    const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonText);

    return parsedData;

  } catch (error) {
    console.error('⚠️ Error al consultar Gemini API, activando fallback local:', error.message);
    return generarLecturaMock(payload);
  }
}