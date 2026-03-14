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
- Idempotencia de eventos llevada a capa de persistencia (ya no solo en memoria del proceso).
- Endpoint de consulta de reporte persistido por entrevista.

## Semana 5
- Persistencia de evaluaciones completas y metadatos de publicación de feedback en PostgreSQL.
- Modo degradado automático a memoria si PostgreSQL no está disponible (resiliencia local).
- Script de inicialización de base de datos + esquema para entorno local.

## Endpoints principales

- `GET /health`
- `POST /orchestrator/evaluate-interview`
- `POST /orchestrator/events/interview-finished`
- `GET /orchestrator/interviews/:interviewId/report`

## Variables de entorno

### Orquestación
- `USE_MOCKS=true|false`
- `HTTP_TIMEOUT_MS=8000`
- `PUBLISH_FEEDBACK=true|false`
- `ORCHESTRATOR_EVENT_TOKEN=dev-token`

### Servicios externos
- `AUDIO_SERVICE_URL=http://audio-analysis-service:3008`
- `VIDEO_SERVICE_URL=http://video-analysis-service:3009`
- `CONTENT_SERVICE_URL=http://content-evaluation-service:3010`
- `CODE_SERVICE_URL=http://code-evaluation-service:3011`
- `FEEDBACK_SERVICE_URL=http://feedback-service:3012`

### PostgreSQL local
- `ENABLE_DB=true|false`
- `POSTGRES_HOST=localhost`
- `POSTGRES_PORT=5432`
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=1234`
- `POSTGRES_DB=mic_orchestrator`

## Inicialización de BD local

```bash
cd services/orchestrator-service
npm run db:init
```

El script crea la base `mic_orchestrator` (si no existe) y aplica `src/db/schema.sql`.
