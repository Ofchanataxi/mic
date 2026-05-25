# Frontend Prep Fix Summary

## Objetivo

Dejar backend y API Gateway listos para que el frontend React consuma unicamente `api-gateway`, sin llamar directamente a microservicios internos.

## Cambios aplicados

### 1. Media gateway-only

- `GET /api/v1/media/:id/access` ahora se resuelve en API Gateway antes del proxy generico.
- El gateway consulta internamente a `media-service` y reemplaza `accessUrl` por una URL bajo API Gateway:
  - `http://localhost:8080/api/v1/media/:id/file?accessToken=...`
- `GET /api/v1/media/:id/file` sigue proxyeando a `media-service`, pero ahora el gateway acepta el JWT tambien como query param `accessToken` para permitir reproduccion desde elementos de video del browser.
- `media-service` sigue generando su `accessUrl` interno como antes para consumo directo entre servicios.

Archivos:

- `api-gateway/src/controllers/mediaGatewayController.js`
- `api-gateway/src/routes/gatewayRoutes.js`
- `api-gateway/src/middlewares/authMiddleware.js`

### 2. Upload PDF sin interviewId

- `media-service` ya no exige `interviewId` cuando `resourceType=PDF`.
- `interviewId` sigue siendo obligatorio cuando `resourceType=VIDEO`.
- El schema Prisma de media permite `interviewId` nullable.
- Se agrego migracion para quitar `NOT NULL` en `media.interviewId`.

Archivos:

- `media-service/src/utils/validators.js`
- `media-service/src/services/mediaService.js`
- `media-service/prisma/schema.prisma`
- `media-service/prisma/migrations/20260524180000_allow_pdf_without_interview_id/migration.sql`
- `media-service/README.md`

### 3. Historial del usuario

- `interview-service` expone una lista resumida por usuario:
  - `GET /interviews?userId=:userId`
- `api-gateway` expone:
  - `GET /api/v1/me/history`
- El gateway resuelve `userId` desde JWT y agrega, cuando existe, informacion de feedback desde `feedback-service`.

Response de `/api/v1/me/history`:

```json
{
  "userId": "uuid",
  "items": [
    {
      "interviewId": "uuid",
      "createdAt": "2026-05-24T16:00:00.000Z",
      "targetRole": "Backend Developer",
      "level": "JUNIOR",
      "interviewStatus": "FINISHED",
      "evaluationStatus": "DISPATCHED",
      "feedbackStatus": "READY",
      "globalScore": 82,
      "videoMediaId": "uuid",
      "feedbackReportId": "uuid"
    }
  ]
}
```

Limitacion actual:

- `feedbackStatus`, `globalScore` y `feedbackReportId` solo aparecen si `feedback-service` ya tiene reporte para la entrevista.

Archivos:

- `interview-service/src/routes/interviewRoutes.js`
- `interview-service/src/controllers/interviewController.js`
- `interview-service/src/services/interviewService.js`
- `interview-service/src/repositories/interviewRepository.js`
- `api-gateway/src/controllers/meController.js`
- `api-gateway/src/clients/serviceClient.js`
- `api-gateway/src/routes/meRoutes.js`

### 4. Rutas internas no publicadas al frontend

El gateway bloquea estas rutas y responde `404 ROUTE_NOT_EXPOSED`:

- `POST /api/v1/candidates/:userId/performance`
- `GET /api/v1/interviews/:id/evaluation-payload`
- `GET /api/v1/interviews/:id/evaluation-data`
- `POST /api/v1/evaluations/process`
- `POST /api/v1/feedback/evaluation-ready`
- `POST /api/v1/feedback/generate`

Las rutas siguen disponibles directamente en sus microservicios para comunicacion interna.

Archivo:

- `api-gateway/src/routes/gatewayRoutes.js`

### 5. Rutas `/me`

Se agregaron rutas gateway-friendly que usan el `userId` del JWT:

- `GET /api/v1/me`
- `GET /api/v1/me/profile`
- `GET /api/v1/me/topics`
- `GET /api/v1/me/reports`
- `GET /api/v1/me/history`

Archivos:

- `api-gateway/src/routes/meRoutes.js`
- `api-gateway/src/controllers/meController.js`

## Endpoints listos para frontend

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /api/v1/me`

### CV / Perfil

- `POST /api/v1/media/upload` con `resourceType=PDF`, sin `interviewId`.
- `POST /api/v1/candidates/profile/from-cv`
- `GET /api/v1/me/profile`
- `GET /api/v1/me/topics`

### Entrevista

- `POST /api/v1/interviews`
- `GET /api/v1/interviews/:id`
- `POST /api/v1/interviews/:id/start`
- `POST /api/v1/interviews/:id/finish`

### Video

- `POST /api/v1/media/upload` con `resourceType=VIDEO` e `interviewId`.
- `GET /api/v1/media/:id/status`
- `GET /api/v1/media/:id/access`
- `GET /api/v1/media/:id/file`

### Evaluacion

- `GET /api/v1/evaluations/jobs/:interviewId/status`
- `GET /api/v1/evaluations/interviews/:interviewId`
- `GET /api/v1/evaluations/interviews/:interviewId/questions`

### Feedback e historial

- `GET /api/v1/me/reports`
- `GET /api/v1/me/history`
- `GET /api/v1/feedback/interviews/:interviewId`
- `GET /api/v1/feedback/reports/:reportId`

## Pendiente

- Agregar ownership real en microservicios o gateway para impedir que un usuario consulte recursos de otro usuario por id.
- Reemplazar `accessToken` en query por URLs firmadas temporales o streaming con cookies seguras antes de produccion.
- Crear un endpoint agregado de estado de procesamiento si el frontend necesita una sola llamada para media + evaluation + feedback.
- Decidir si `POST /api/v1/evaluations/interviews` y rutas retry deben quedar expuestas solo para admin.

## Verificaciones ejecutadas

- `node --check` en archivos JS modificados de `api-gateway`, `interview-service` y `media-service`.
- `docker compose config`.

Resultado:

- `node --check` paso sin errores.
- `docker compose config` paso y genero configuracion valida. Docker emitio warnings de acceso a `C:\Users\mrcolina\.docker\config.json`, pero el comando termino con exit code 0.

