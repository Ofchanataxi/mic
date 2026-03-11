# MIC Platform Monorepo

Base de microservicios para simulación multimodal de entrevistas.

## Estado actual del Proceso B

`services/orchestrator-service` incluye:

- Base de semana 1 (scoring + reporte + endpoint principal).
- Integración básica de semana 2 con servicios externos (audio/video/content/code).
- Modo mock configurable (`USE_MOCKS=true`) para desarrollo local.

## Probar módulo orquestador

```bash
cd services/orchestrator-service
npm test
npm start
```

Endpoint principal:

- `POST /orchestrator/evaluate-interview`
