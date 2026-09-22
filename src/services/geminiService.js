// src/services/geminiService.js

// Clave de API leída desde las variables de entorno de Expo / Vercel
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

/**
 * Módulo de Fallback Local Dinámico
 * Se activa si no hay API Key o si la llamada a Gemini falla.
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
      const pregLimpia = pregunta && pregunta.trim() !== '' ? pregunta.trim() : 'tu consulta general';
      
      // Múltiples perspectivas dinámicas para garantizar variabilidad en el fallback local
      const enfoques = [
        `Respecto a "${pregLimpia}", el mapa simbólico encabezado por ${c1} señala la necesidad de revisar tus supuestos iniciales. La interacción de ${c2} advierte sobre resistencias del entorno o inseguridades internas, mientras que la salida con ${c3} sugiere tomar una postura proactiva alineada con tus prioridades reales.`,
        
        `Al consultar sobre "${pregLimpia}", los arcanos marcan un punto de inflexión. ${c1} representa el motor del cambio que ya se ha activado. Sin embargo, ${c2} te pide hacer una pausa estratégica para no actuar desde el impulso. Finalmente, ${c3} indica que la claridad llegará mediante la observación consciente.`,
        
        `Frente a la inquietud "${pregLimpia}", la energía de ${c1} te invita a desapegarte de expectativas rígidas. La presencia central de ${c2} pone el foco en fortalecer tu autoconfianza, y ${c3} proyecta una resolución favorable siempre que mantengas la coherencia con tus valores.`
      ];

      // Selección dinámica basada en el texto para evitar respuestas duplicadas
      const indice = (pregLimpia.length + c1.length) % enfoques.length;

      return {
        pregunta_reflexion: `🔮 Orientación Terapéutica sobre: "${pregLimpia}"\n\n` +
          `✨ Arcanos Guía: ${c1} • ${c2} • ${c3}\n\n` +
          `${enfoques[indice]}\n\n` +
          `💡 Pregunta de reflexión: ¿Qué pequeño paso concreto puedes dar hoy respecto a esta situación sin buscar el control absoluto del resultado?`
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
 */
export async function procesarLecturaTarot(payload) {
  const { tipo, cartas, pregunta } = payload;

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
        El usuario plantea la siguiente PREGUNTA ABIERTA O INQUIETUD ESPECÍFICA: "${pregunta || 'Consulta de orientación general'}".
        Las 3 cartas seleccionadas como guía en orden son: ${JSON.stringify(cartas)}.

        INSTRUCCIÓN OBLIGATORIA: Genera una interpretación 100% ÚNICA, PERSONALIZADA Y ESPECÍFICA para la pregunta "${pregunta}". NO uses respuestas genéricas ni repetitivas.

        Estructura la respuesta abarcando:
        1. Análisis directo de cómo los 3 arcanos seleccionados responden e interaccionan con la pregunta planteada.
        2. Una reflexión terapéutica práctica y una orientación concreta para la toma de decisiones.

        Responde ÚNICAMENTE un objeto JSON válido con el formato exacto:
        {
          "pregunta_reflexion": "Texto completo, detallado y personalizado de la orientación terapéutica"
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
          temperature: 0.85, // Incrementado para asegurar variabilidad y respuestas únicas
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

    const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonText);

    return parsedData;

  } catch (error) {
    console.error('⚠️ Error al consultar Gemini API, activando fallback local:', error.message);
    return generarLecturaMock(payload);
  }
}