# 🏛️ Tarot Analytics & Executive Self-Observation App

Una aplicación móvil personal desarrollada con **React Native (Expo)** e integrada con la **API de Gemini (v2.5 Flash)**. Su propósito es estructurar lecturas de tarot orientadas a la autorreflexión, la toma de decisiones operativas (*Phronesis*) y la soberanía personal, evitando interpretaciones fatalistas y priorizando el rigor analítico en la salud, las finanzas y las relaciones.

---

## 🚀 Características Principales

- **Panel Diario Unificado:** Registro rápido de arcanos para Sensación Diaria, Motivos de Gratitud, Tríptico de Consejos (Amor, Dinero, Salud) y Pregunta Terapéutica.
- **Motor AI Parametrizado (Gemini 2.5 Flash):** Procesamiento de lecturas con un *System Prompt* personalizado enfocado en la autonomía, el rigor ejecutivo y la autorregulación física y emocional.
- **Structured JSON Outputs:** Uso estricto de `responseSchema` para garantizar que las respuestas de la IA retornen en formato JSON puro, sin textos superfluos ni inconsistencias.
- **Trazabilidad y Métricas:** Generación automática de un **Puntaje Energético (1 al 10)** por sesión para almacenar en base de datos y graficar tendencias históricas (altos y bajos).
- **Interfaz Ejecutiva:** Diseño oscuro (*Slate & Amber*) adaptado para lectura ágil sin distracciones.

---

## 🏗️ Arquitectura del Proyecto

```text
AppTarotRaul/
├── App.js                         # Punto de entrada raíz de la aplicación
├── app.json                       # Configuración global de Expo
├── .env                           # Variables de entorno (API Keys securizadas)
├── README.md                      # Documentación del proyecto
└── src/
    ├── screens/
    │   └── DashboardScreen.jsx    # Interfaz principal de selección de arcanos y resultados
    └── services/
        └── geminiService.js       # Integración con el SDK @google/genai y esquema JSON