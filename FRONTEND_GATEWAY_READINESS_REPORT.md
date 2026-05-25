# Frontend Gateway Readiness Report

## 1. Resumen ejecutivo

El frontend React + Vite puede empezar parcialmente contra `api-gateway`, porque el gateway ya expone rutas proxy bajo `/api/v1` para auth, media, candidates, interviews, evaluations y feedback. El flujo feliz basico de registro/login, upload, perfil, entrevista, evaluacion y feedback es alcanzable en gran parte sin llamar directamente a los microservicios.

No esta completamente listo para construir el frontend end-to-end de forma limpia y estrictamente gateway-only. Los principales bloqueos son:

- `media-service` devuelve `accessUrl` apuntando a `media-service` (`SERVICE_BASE_URL=http://localhost:3000`), no al gateway. Esto rompe la regla de que el frontend no consuma servicios internos, especialmente para reproducir video.
- No existe una ruta de historial de entrevistas por usuario. El feedback lista reportes, pero no todas las entrevistas ni sus estados.
- `media-service` exige `interviewId` tambien para subir PDFs de CV, aunque el CV se sube antes de crear una entrevista.
- El gateway expone endpoints internos o sensibles por proxy generico: performance de candidate, evaluation-payload de interview, process/retry de evaluation, generation/retry de feedback.
- El gateway autentica, pero no traduce rutas a recursos del usuario actual. El frontend debe enviar `userId` en paths/bodies y los servicios internos no muestran validacion de ownership contra `x-user-id`.

Conclusion: se puede avanzar con pantallas y un prototipo de flujo feliz, pero antes de cerrar el frontend real conviene corregir los bloqueos criticos/altos del gateway y media/history.

## 2. Mapa de rutas disponibles en API Gateway

El gateway monta proxies genericos. La regla de rewrite es:

- `/api/v1/auth/*` -> `auth-service` `/auth/*`
- `/api/v1/media/*` -> `media-service` `/media/*`
- `/api/v1/candidates/*` -> `candidate-service` `/candidates/*`
- `/api/v1/interviews/*` -> `interview-service` `/interviews/*`
- `/api/v1/evaluations/*` -> `evaluation-service` `/evaluations/*`
- `/api/v1/feedback/*` -> `feedback-service` `/feedback/*`

| Metodo | Ruta gateway | Servicio destino | Ruta destino | Requiere auth | Multipart | Estado |
|---|---|---|---|---|---|---|
| GET | `/health` | api-gateway | local | No | No | OK |
| GET | `/api/v1/health` | api-gateway | local | No | No | OK |
| GET | `/api/v1/health/services` | api-gateway | local checks | No | No | OK |
| POST | `/api/v1/auth/register` | auth-service | `/auth/register` | No | No | OK |
| POST | `/api/v1/auth/login` | auth-service | `/auth/login` | No | No | OK |
| POST | `/api/v1/auth/refresh` | auth-service | `/auth/refresh` | No | No | OK |
| POST | `/api/v1/auth/logout` | auth-service | `/auth/logout` | Si | No | OK |
| GET | `/api/v1/auth/me` | auth-service | `/auth/me` | Si | No | OK |
| POST | `/api/v1/media/upload` | media-service | `/media/upload` | Si | Si | WARNING |
| GET | `/api/v1/media/:id` | media-service | `/media/:id` | Si | No | OK |
| GET | `/api/v1/media/:id/status` | media-service | `/media/:id/status` | Si | No | OK |
| GET | `/api/v1/media/:id/access` | media-service | `/media/:id/access` | Si | No | WARNING |
| GET | `/api/v1/media/:id/file` | media-service | `/media/:id/file` | Si | No | WARNING |
| POST | `/api/v1/candidates/profile/from-cv` | candidate-service | `/candidates/profile/from-cv` | Si | No | OK |
| GET | `/api/v1/candidates/profile/:userId` | candidate-service | `/candidates/profile/:userId` | Si | No | WARNING |
| GET | `/api/v1/candidates/:userId/topics` | candidate-service | `/candidates/:userId/topics` | Si | No | WARNING |
| GET | `/api/v1/candidates/:userId/adaptive-strategy` | candidate-service | `/candidates/:userId/adaptive-strategy` | Si | No | WARNING |
| POST | `/api/v1/candidates/:userId/performance` | candidate-service | `/candidates/:userId/performance` | Si | No | ERROR |
| POST | `/api/v1/interviews` | interview-service | `/interviews` | Si | No | OK |
| GET | `/api/v1/interviews/:id` | interview-service | `/interviews/:id` | Si | No | OK |
| POST | `/api/v1/interviews/:id/start` | interview-service | `/interviews/:id/start` | Si | No | OK |
| POST | `/api/v1/interviews/:id/finish` | interview-service | `/interviews/:id/finish` | Si | No | OK |
| GET | `/api/v1/interviews/:id/evaluation-payload` | interview-service | `/interviews/:id/evaluation-payload` | Si | No | ERROR |
| GET | `/api/v1/interviews/:id/evaluation-data` | interview-service | `/interviews/:id/evaluation-data` | Si | No | ERROR |
| GET | `/api/v1/interviews?userId=:userId` | interview-service | No existe | Si | No | ERROR |
| POST | `/api/v1/evaluations/interviews` | evaluation-service | `/evaluations/interviews` | Si | No | WARNING |
| POST | `/api/v1/evaluations/process` | evaluation-service | `/evaluations/process` | Si | No | ERROR |
| GET | `/api/v1/evaluations/jobs/:interviewId/status` | evaluation-service | `/evaluations/jobs/:interviewId/status` | Si | No | OK |
| GET | `/api/v1/evaluations/interviews/:interviewId` | evaluation-service | `/evaluations/interviews/:interviewId` | Si | No | OK |
| GET | `/api/v1/evaluations/interviews/:interviewId/questions` | evaluation-service | `/evaluations/interviews/:interviewId/questions` | Si | No | OK |
| POST | `/api/v1/evaluations/interviews/:interviewId/retry` | evaluation-service | `/evaluations/interviews/:interviewId/retry` | Si | No | WARNING |
| POST | `/api/v1/feedback/evaluation-ready` | feedback-service | `/feedback/evaluation-ready` | Si | No | ERROR |
| POST | `/api/v1/feedback/generate` | feedback-service | `/feedback/generate` | Si | No | ERROR |
| GET | `/api/v1/feedback/jobs/:interviewId/status` | feedback-service | `/feedback/jobs/:interviewId/status` | Si | No | OK |
| GET | `/api/v1/feedback/interviews/:interviewId` | feedback-service | `/feedback/interviews/:interviewId` | Si | No | OK |
| GET | `/api/v1/feedback/users/:userId/reports` | feedback-service | `/feedback/users/:userId/reports` | Si | No | WARNING |
| GET | `/api/v1/feedback/reports/:reportId` | feedback-service | `/feedback/reports/:reportId` | Si | No | OK |
| POST | `/api/v1/feedback/interviews/:interviewId/retry` | feedback-service | `/feedback/interviews/:interviewId/retry` | Si | No | WARNING |

Notas tecnicas del gateway:

- Multipart/form-data pasa por proxy sin `express.json()` en gateway, asi que el stream no se consume antes de llegar a `media-service`.
- El timeout general es `120000ms`; para media es `300000ms`.
- CORS permite por defecto `http://localhost:5173` y `http://localhost:3000`.
- El gateway agrega `x-user-id`, `x-user-role` y `x-user-email` cuando el JWT es valido.

## 3. Flujo frontend esperado vs rutas disponibles

### Auth

Endpoints necesarios:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

Endpoints disponibles: todos existen.

Payload esperado:

```json
{
  "email": "candidate@example.com",
  "password": "Password123",
  "firstName": "Ada",
  "lastName": "Lovelace"
}
```

Response esperado:

```json
{
  "user": {
    "id": "uuid",
    "email": "candidate@example.com",
    "role": "CANDIDATE"
  },
  "accessToken": "jwt",
  "refreshToken": "token"
}
```

Estado: OK. Para ejecucion local fuera de Docker, `api-gateway/.env.example` deja `JWT_SECRET` vacio; hay que configurarlo o las rutas protegidas fallaran.

### CV / Perfil

Endpoints necesarios:

- `POST /api/v1/media/upload` para PDF.
- `POST /api/v1/candidates/profile/from-cv`.
- `GET /api/v1/candidates/profile/:userId`.
- `GET /api/v1/candidates/:userId/topics`.

Endpoints disponibles: existen.

Payload upload PDF esperado por media:

```http
POST /api/v1/media/upload
Content-Type: multipart/form-data

file=<cv.pdf>
resourceType=PDF
ownerId=<userId>
interviewId=<required-currently>
```

Response upload esperado:

```json
{
  "mediaId": "uuid",
  "status": "READY",
  "message": "PDF uploaded successfully"
}
```

Payload crear perfil:

```json
{
  "userId": "uuid",
  "mediaId": "uuid",
  "targetRole": "Backend Developer",
  "level": "JUNIOR"
}
```

Estado: WARNING. La subida de PDF exige `interviewId` aunque todavia no existe entrevista. Para un frontend limpio, el media upload de PDF deberia aceptar `interviewId` opcional o usar un campo de contexto distinto.

### Entrevista

Endpoints necesarios:

- `POST /api/v1/interviews`.
- `GET /api/v1/interviews/:id`.
- `POST /api/v1/interviews/:id/start`.
- `POST /api/v1/interviews/:id/finish`.

Endpoints disponibles: todos existen.

Payload crear entrevista:

```json
{
  "userId": "uuid",
  "candidateProfileId": "uuid",
  "targetRole": "Backend Developer",
  "level": "JUNIOR",
  "questionCount": 8
}
```

Payload finalizar entrevista:

```json
{
  "videoMediaId": "uuid",
  "responses": [
    {
      "questionId": "uuid",
      "answerText": "Respuesta del candidato",
      "videoStartMs": 0,
      "videoEndMs": 12000,
      "answerStartedAt": "2026-05-24T16:00:00.000Z",
      "answerEndedAt": "2026-05-24T16:00:12.000Z",
      "codeSubmission": {
        "language": "javascript",
        "code": "function solve() { return true; }"
      }
    }
  ]
}
```

Estado: OK para flujo de entrevista. Falta una ruta para listar entrevistas por usuario, necesaria para Historial.

### Video

Endpoints necesarios:

- `POST /api/v1/media/upload` para video.
- `GET /api/v1/media/:id/status`.
- `GET /api/v1/media/:id/access`.
- `GET /api/v1/media/:id/file` o una URL reproducible via gateway.

Endpoints disponibles: existen.

Payload upload video esperado:

```http
POST /api/v1/media/upload
Content-Type: multipart/form-data

file=<interview.mp4>
resourceType=VIDEO
ownerId=<userId>
interviewId=<interviewId>
```

Response upload esperado:

```json
{
  "mediaId": "uuid",
  "status": "UPLOADED",
  "message": "Video uploaded and queued for processing"
}
```

Estado: ERROR para contrato estrictamente gateway-only. `GET /api/v1/media/:id/access` devuelve `accessUrl` construido con `SERVICE_BASE_URL` de `media-service`, actualmente `http://localhost:3000/media/:id/file`. El frontend terminaria llamando a `media-service` directamente si usa esa URL. Ademas, reproducir `/api/v1/media/:id/file` con `<video src>` requiere una estrategia para Authorization header, porque el gateway protege la ruta.

### Evaluacion

Endpoints necesarios:

- `GET /api/v1/evaluations/jobs/:interviewId/status`.
- `GET /api/v1/evaluations/interviews/:interviewId`.
- `GET /api/v1/evaluations/interviews/:interviewId/questions`.
- `POST /api/v1/evaluations/interviews` solo si el frontend necesitara disparar evaluacion manualmente.

Endpoints disponibles: existen.

Payload dispatch manual:

```json
{
  "interviewId": "uuid"
}
```

Response resultado esperado: evaluacion por entrevista con scores globales y detalles por pregunta.

Estado: OK/WARNING. El flujo normal deberia dispararse desde `interview-service` al finalizar. El frontend puede consultar estado/resultados, pero tambien quedan expuestas rutas internas (`/process`, retry) que no deberian ser parte del contrato publico sin roles/admin.

### Feedback

Endpoints necesarios:

- `GET /api/v1/feedback/jobs/:interviewId/status`.
- `GET /api/v1/feedback/interviews/:interviewId`.
- `GET /api/v1/feedback/users/:userId/reports`.
- `GET /api/v1/feedback/reports/:reportId`.

Endpoints disponibles: existen.

Response esperado para reporte final: resumen ejecutivo, fortalezas, areas de mejora, recomendaciones y analisis por pregunta.

Estado: OK/WARNING. Hay suficientes rutas para consumir reportes generados, pero no hay una ruta agregada que combine entrevista + evaluacion + feedback para la pantalla de detalle. Tambien quedan expuestas rutas internas de generacion/retry.

### Historial

Endpoints necesarios:

- Listar entrevistas del usuario con fecha, targetRole, level, status, evaluationStatus, feedbackStatus y score global si existe.
- Entrar al detalle de una entrevista.
- Entrar al feedback si esta disponible.

Endpoints disponibles:

- `GET /api/v1/feedback/users/:userId/reports` lista reportes existentes.
- `GET /api/v1/interviews/:id` consulta una entrevista puntual.

Endpoints faltantes:

- `GET /api/v1/interviews?userId=:userId`.
- O mejor: `GET /api/v1/me/interviews`.
- O una ruta agregada del gateway/BFF: `GET /api/v1/me/history`.

Estado: ERROR. No se puede construir un historial completo solo con los endpoints actuales, porque las entrevistas sin feedback no aparecen en `feedback/users/:userId/reports`.

## 4. Bloqueos para construir frontend

### Critico

1. `accessUrl` de media apunta a `media-service`, no al gateway.
   - Impacto: rompe la regla de consumo unico por API Gateway y dificulta reproduccion de video/PDF desde React.
   - Evidencia: `media-service` construye `accessUrl` como `${SERVICE_BASE_URL}/media/:id/file`; compose usa `SERVICE_BASE_URL=http://localhost:3000`.

2. No existe historial completo de entrevistas por usuario.
   - Impacto: el modulo Historial no puede listar entrevistas en proceso, finalizadas sin feedback o fallidas.
   - Disponible hoy: solo reportes de feedback por usuario.

### Alto

1. Upload de PDF exige `interviewId`.
   - Impacto: el flujo CV/perfil ocurre antes de crear entrevista; el frontend tendria que mandar un valor artificial.

2. Endpoints internos quedan expuestos por gateway generico.
   - Impacto: el frontend autenticado puede invocar endpoints que deberian ser internos/admin, como performance update, evaluation payload, process, generation y retry.

3. No hay rutas `me` para recursos del usuario actual.
   - Impacto: el frontend debe usar `userId` en URL/body. Sin validacion de ownership visible en servicios internos, un usuario podria pedir datos de otro cambiando el path.

4. `JWT_SECRET` vacio en `api-gateway/.env.example`.
   - Impacto: local fuera de Docker puede fallar en rutas protegidas si el dev no completa la variable. Docker usa `dev-secret`, pero el ejemplo local no.

### Medio

1. `JSON_BODY_LIMIT=10mb` aparece en gateway pero no se usa porque el gateway no monta body parser.
2. El gateway no ofrece un endpoint agregado de estado de procesamiento que combine media, evaluation y feedback.
3. `GET /api/v1/health/services` esta publico y expone disponibilidad interna; util en desarrollo, discutible para produccion.

### Bajo

1. Los README aun pueden inducir a usar URLs directas de microservicios.
2. Los endpoints admin de auth estan bajo `/api/v1/auth/admin/*`; funcional, pero conviene mantenerlos fuera del contrato inicial del frontend candidato.

## 5. Recomendaciones de correccion

Antes de implementar el frontend completo:

1. Hacer que el acceso a media sea gateway-only.
   - Opcion simple: configurar `SERVICE_BASE_URL=http://localhost:8080/api/v1` para media cuando se consuma desde browser, de forma que `accessUrl` apunte a `/api/v1/media/:id/file`.
   - Opcion mas limpia: agregar en gateway una respuesta normalizada o rewrite de `accessUrl`.
   - Para `<video>`, definir si se usara fetch como blob con Authorization o URLs firmadas/temporales sin header.

2. Agregar historial.
   - Minimo: `GET /api/v1/interviews?userId=:userId` proxied a `interview-service`.
   - Mejor contrato frontend: `GET /api/v1/me/interviews` o `GET /api/v1/me/history`.

3. Permitir PDF upload sin `interviewId`.
   - Mantener `interviewId` obligatorio para `VIDEO`.
   - Para `PDF`, usar `ownerId` y `resourceType=PDF`; opcionalmente agregar `context=CV`.

4. Separar contrato publico de endpoints internos.
   - Bloquear o no montar en gateway: candidate performance, interview evaluation-payload/evaluation-data, evaluation process, feedback evaluation-ready/generate.
   - Dejar retry solo para admin o para una accion controlada.

5. Introducir rutas `me`.
   - `GET /api/v1/me`
   - `GET /api/v1/me/profile`
   - `GET /api/v1/me/topics`
   - `GET /api/v1/me/interviews`
   - `GET /api/v1/me/reports`
   Estas rutas deberian resolver `userId` desde JWT, no desde parametros enviados por React.

6. Alinear env local.
   - Poner un `JWT_SECRET=dev-secret` explicito en `.env.example` o documentar que debe copiarse desde Docker.

## 6. Contrato frontend sugerido

Este contrato mantiene a React consumiendo solo API Gateway y oculta microservicios internos.

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### CV / Perfil

- `POST /api/v1/media/upload`
  - Multipart PDF.
  - Campos: `file`, `resourceType=PDF`, `ownerId`.
  - `interviewId` no deberia ser requerido para PDF.
- `POST /api/v1/candidates/profile/from-cv`
  - Body: `{ "mediaId": "uuid", "targetRole": "string", "level": "JUNIOR" }`.
  - Idealmente `userId` se resuelve desde JWT en gateway o candidate-service.
- `GET /api/v1/me/profile`
- `GET /api/v1/me/topics`

### Entrevista

- `POST /api/v1/interviews`
  - Body: `{ "candidateProfileId": "uuid", "targetRole": "string", "level": "JUNIOR", "questionCount": 8 }`.
  - Idealmente `userId` desde JWT.
- `GET /api/v1/interviews/:interviewId`
- `POST /api/v1/interviews/:interviewId/start`
- `POST /api/v1/interviews/:interviewId/finish`

### Video

- `POST /api/v1/media/upload`
  - Multipart video.
  - Campos: `file`, `resourceType=VIDEO`, `ownerId`, `interviewId`.
- `GET /api/v1/media/:mediaId/status`
- `GET /api/v1/media/:mediaId/access`
  - Debe devolver URL gateway-only.
- `GET /api/v1/media/:mediaId/file`
  - Debe tener estrategia compatible con playback en browser.

### Procesamiento / Evaluacion

- `GET /api/v1/evaluations/jobs/:interviewId/status`
- `GET /api/v1/evaluations/interviews/:interviewId`
- `GET /api/v1/evaluations/interviews/:interviewId/questions`

Ruta opcional/admin:

- `POST /api/v1/evaluations/interviews`
  - Body: `{ "interviewId": "uuid" }`.

### Feedback

- `GET /api/v1/feedback/jobs/:interviewId/status`
- `GET /api/v1/feedback/interviews/:interviewId`
- `GET /api/v1/feedback/reports/:reportId`
- `GET /api/v1/me/reports`

### Historial

Ruta recomendada:

- `GET /api/v1/me/history`

Response sugerido:

```json
{
  "items": [
    {
      "interviewId": "uuid",
      "createdAt": "2026-05-24T16:00:00.000Z",
      "targetRole": "Backend Developer",
      "level": "JUNIOR",
      "interviewStatus": "FINISHED",
      "evaluationStatus": "COMPLETED",
      "feedbackStatus": "READY",
      "globalScore": 82,
      "videoMediaId": "uuid",
      "feedbackReportId": "uuid"
    }
  ]
}
```

Esta ruta puede vivir inicialmente en `interview-service` si solo lista entrevistas, o en el gateway como agregador si debe combinar interview, evaluation y feedback.

