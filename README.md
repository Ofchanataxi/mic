# MIC Platform Monorepo

Base de microservicios para simulación multimodal de entrevistas.

## Estado actual del Proceso B (Persona 2)

`services/orchestrator-service` incluye implementación de Semana 1 a Semana 5:

- Orquestación multimodal (audio/video/content/code).
- Scoring y generación de feedback estructurado.
- Flujo por evento `INTERVIEW_FINISHED` vía endpoint interno.
- Publicación de reporte a feedback-service.
- Persistencia en PostgreSQL de evaluaciones e idempotencia de eventos.
- Script de inicialización de base de datos local.

## PostgreSQL local (requerido)

Valores por defecto:

- host: `localhost`
- port: `5432`
- user: `postgres`
- password: `1234`
- db: `mic_orchestrator`

Inicializar:

```bash
cd services/orchestrator-service
npm run db:init
```

## Probar módulo orquestador

```bash
cd services/orchestrator-service
npm test
npm start
```
