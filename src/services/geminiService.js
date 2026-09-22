const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchConTimeout(resource, options = {}, timeout = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Generador de lecturas dinámicas que extrae A, B y C directamente de los arcanos
function generarLecturaMock(payload) {
  const { tipo, cartas, pregunta } = payload;
  const listaCartas = Array.isArray(cartas) && cartas.filter(Boolean).length > 0 
    ? cartas.filter(Boolean)
    : ['El Loco', 'El Mago', 'La Sacerdotisa'];

  const c1 = listaCartas[0] || 'Carta 1';
  const c2 = listaCartas[1] || 'Carta 2';
  const c3 = listaCartas[2] || 'Carta 3';

  switch (tipo) {
    case 'sensacion':
      return {
        resumen: `Compendio de Sensaciones Diarias:\n\n• Sensación A (${c1}): Búsqueda de renovación e impulsos iniciales.\n• Sensación B (${c2}): Necesidad de concentración y dominio mental.\n• Sensación C (${c3}): Sensibilidad profunda e introspección.\n\nSíntesis: El conjunto de arcanos indica una jornada de transición emocional, balanceando la acción directa con la reflexión interior.`,
      };

    case 'gratitud':
      return {
        resumen: `Compendio de Motivos de Gratitud:\n\n• Motivo A (${c1}): Agradecimiento por las oportunidades de aprendizaje y nuevos comienzos.\n• Motivo B (${c2}): Gratitud por la capacidad de enfoque y resolución de problemas.\n• Motivo C (${c3}): Reconocimiento de la sabiduría intuitiva y paz mental.\n\nSíntesis: Las cartas revelan que tu mayor abundancia reside en la claridad de tus decisiones y en la solidez de tus cimientos internos.`,
      };

    case 'triptico':
      return {
        amor: `(${c1}): Comunicar expectativas de forma clara y respetuosa.`,
        dinero: `(${c2}): Mantener prudencia en gastos y evaluar riesgos.`,
        salud: `(${c3}): Pausas de desconexión y regulación del descanso.`,
      };

    case 'terapeutica': {
      const pregLimpia = pregunta && pregunta.trim() !== '' ? pregunta : 'Tu inquietud planteada';
      const hash = (pregLimpia + listaCartas.join('')).length;
      const veredictos = ['SÍ', 'NO', 'PROBABLE / EN DESARROLLO'];
      const veredictoElegido = veredictos[hash % veredictos.length];

      let fundamento = '';
      if (veredictoElegido === 'SÍ') {
        fundamento = `Las cartas ${c1}, ${c2} y ${c3} muestran alineación favorable y apertura de caminos para "${pregLimpia}". La energía respalda el avance.`;
      } else if (veredictoElegido === 'NO') {
        fundamento = `Ante la pregunta "${pregLimpia}", la interacción de ${c1}, ${c2} y ${c3} advierte bloqueos o resistencia en el entorno. Conviene replantear la posición.`;
      } else {
        fundamento = `La combinación de ${c1}, ${c2} y ${c3} indica que la situación sobre "${pregLimpia}" se encuentra en gestación. Hay factores pendientes por manifestarse.`;
      }

      return {
        pregunta_reflexion: `VEREDICTO: ${veredictoElegido}\n\nFundamento: ${fundamento}`,
      };
    }

    default:
      return { resumen: 'Lectura analítica generada correctamente.' };
  }
}

export async function procesarLecturaTarot(payload) {
  if (!API_KEY) {
    return generarLecturaMock(payload);
  }

  const { tipo, cartas, pregunta } = payload;
  let prompt = '';

  switch (tipo) {
    case 'sensacion':
      prompt = `
        Actúa como analista de tarot e introspección.
        Analiza estas 3 cartas seleccionadas: ${JSON.stringify(cartas)}.
        Debes DEDUCIR e INTERPRETAR directamente desde las cartas cuáles son las 3 sensaciones (A, B y C) vividas hoy por el usuario.
        Estructura obligatoria de respuesta:
        "Compendio de Sensaciones Diarias:\\n\\n• Sensación A ([Carta 1]): [Interpretación]\\n• Sensación B ([Carta 2]): [Interpretación]\\n• Sensación C ([Carta 3]): [Interpretación]\\n\\nSíntesis: [Resumen integrado del día]."
        Responde ÚNICAMENTE un JSON con la estructura: {"resumen": "Texto del compendio completo"}
      `;
      break;

    case 'gratitud':
      prompt = `
        Actúa como mentor de mindfulness y tarotista.
        Analiza estas 3 cartas seleccionadas: ${JSON.stringify(cartas)}.
        Debes DEDUCIR e INTERPRETAR directamente desde las cartas cuáles son los 3 motivos de gratitud (A, B y C) revelados hoy.
        Estructura obligatoria de respuesta:
        "Compendio de Motivos de Gratitud:\\n\\n• Motivo A ([Carta 1]): [Interpretación]\\n• Motivo B ([Carta 2]): [Interpretación]\\n• Motivo C ([Carta 3]): [Interpretación]\\n\\nSíntesis: [Resumen integrado de gratitud]."
        Responde ÚNICAMENTE un JSON con la estructura: {"resumen": "Texto del compendio completo"}
      `;
      break;

    case 'triptico':
      prompt = `
        Actúa como consejero estratégico. Analiza este Tríptico:
        Amor: ${JSON.stringify(cartas?.amor)}, Dinero: ${JSON.stringify(cartas?.dinero)}, Salud: ${JSON.stringify(cartas?.salud)}.
        Responde ÚNICAMENTE un JSON con este formato: {"amor": "Consejo breve", "dinero": "Consejo breve", "salud": "Consejo breve"}
      `;
      break;

    case 'terapeutica':
      prompt = `
        Actúa como terapeuta y analista directo de tarot.
        Pregunta concreta del usuario: "${pregunta}".
        Las 3 cartas seleccionadas son: ${JSON.stringify(cartas)}.
        Comienza OBLIGATORIAMENTE con un VEREDICTO claro (SÍ, NO, o PROBABLE / EN DESARROLLO) y luego entrega el Fundamento respondiendo explícitamente a "${pregunta}" basado en las 3 cartas.
        Responde ÚNICAMENTE un JSON con la estructura: {"pregunta_reflexion": "VEREDICTO: [SÍ / NO / PROBABLE]\\n\\nFundamento: [Explicación explícita según las cartas]."}
      `;
      break;

    default:
      prompt = 'Analiza estas cartas y entrega una lectura estratégica.';
  }

  const modelos = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

  for (const modelo of modelos) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${API_KEY}`;
      const response = await fetchConTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }, 5000);

      if (response.ok) {
        const data = await response.json();
        let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(rawText);
      }
    } catch (err) {
      console.warn(`[Gemini] Error en modelo ${modelo}:`, err.message);
    }
  }

  return generarLecturaMock(payload);
}