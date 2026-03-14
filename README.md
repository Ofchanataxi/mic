# MIC Platform Monorepo

Base de microservicios para simulación multimodal de entrevistas.

## Estado actual del Proceso B

`services/orchestrator-service` incluye:

- Semana 1: scoring multimodal + reporte.
- Semana 2: integración básica con servicios externos (audio/video/content/code).
- Semana 3: orquestación interna por evento y publicación a feedback-service.

## Probar módulo orquestador

```bash
cd services/orchestrator-service
npm test
npm start
```

Endpoints principales:

- `POST /orchestrator/evaluate-interview`
- `POST /orchestrator/events/interview-finished`
Endpoint principal:

- `POST /orchestrator/evaluate-interview`
