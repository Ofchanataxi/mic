# MIC Platform Monorepo

Base de microservicios para simulación multimodal de entrevistas.

## Estado actual del Proceso B (Persona 2)

### `services/orchestrator-service`

- Orquestación multimodal (audio/video/content/code).
- Scoring y generación de feedback estructurado.
- Flujo por evento `INTERVIEW_FINISHED` vía endpoint interno.
- Publicación de reporte a feedback-service.
- Persistencia en PostgreSQL para eventos procesados y resumen de entrevista.

### `services/audio-analysis-service`

- Análisis de silencios con `ffmpeg`.
- Extracción de audio por segmento.
- Transcripción local por comando STT configurable (ej. `whisper-cli`).
- Cálculo de métricas: `speechRate`, `pauseRatio`, `fluencyScore`, `confidenceScore`.

### `services/video-analysis-service`

- Análisis local con `ffmpeg` usando `signalstats` y `cropdetect` por segmento.
- Métricas basadas en evidencia visual real: `postureScore`, `nervousMovementScore`, `attentionScore`.
- `eyeContactScore` se devuelve como `null` hasta integrar modelo facial específico (MediaPipe/Face API).

### `services/code-evaluation-service`

- Evaluación simulada por heurísticas para avanzar mientras se integra Judge0.
- Endpoint `POST /code/evaluate` compatible con el orquestador.
- Score estructurado con `passedTests`, `totalTests`, `compileError`, `executionTime`, `memoryUsage` y metadatos de análisis.
- Soporte inicial para `javascript`, `typescript`, `python`, `java` y `cpp`.

## Base de datos única del proyecto

El servicio usa la **misma base de datos compartida** del proyecto:

- DB por defecto: `mic_platform`
- host: `localhost`
- port: `5432`
- user: `postgres`
- password: `1234`

Inicializar DB + esquema (cross-platform, funciona en Windows):

```bash
cd services/orchestrator-service
npm run db:init
```
