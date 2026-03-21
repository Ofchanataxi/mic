# Proceso B — Semana 1 a Semana 5 (Persona 2)

Este documento resume lo implementado para **Ejecución, Evaluación y Feedback**.

## Semana 1
- Esqueleto del orquestador multimodal.
- Scoring inicial por pregunta y global.
- Reporte estructurado base.

## Semana 2
- Integración básica con servicios de audio, video, contenido y código.
- Manejo de fallas parciales con `Promise.allSettled`.

## Semana 3
- Flujo orientado a evento con endpoint `POST /orchestrator/events/interview-finished`.
- Token interno de seguridad por header.
- Publicación del reporte a feedback-service.

## Semana 4
- Idempotencia de eventos en persistencia durable (`orchestrator_processed_events`).
- Endpoint de consulta de resumen persistido por entrevista.

## Semana 5
- Integración con **BD única del proyecto** (`mic_platform`) usando el esquema relacional compartido.
- Persistencia en `interview_summaries` con adaptación desde resultados multimodales.
- Script de inicialización **cross-platform** (`npm run db:init`) con Node.js.

## Audio Analysis (estado actual)
- `POST /audio/analyze`.
- Detección real de silencios por segmento con `ffmpeg`.
- Transcripción local con STT configurable por comando (`STT_COMMAND`, `STT_MODEL_PATH`, etc.).
- Métricas calculadas desde datos reales (sin pseudo-random).

## Video Analysis (estado actual)
- `POST /video/analyze`.
- Extracción de métricas visuales reales por segmento con `ffmpeg`:
  - `signalstats` (variación luminancia/saturación)
  - `cropdetect` (desplazamiento del cuadro detectado para índice de movimiento)
- Scores derivados:
  - `postureScore`
  - `nervousMovementScore`
  - `attentionScore`
- `eyeContactScore` queda `null` con warning hasta integrar modelo específico de rostro/mirada.
