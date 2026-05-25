# api-gateway

`api-gateway` es el punto único de entrada del frontend hacia los microservicios MIC. Enruta requests, valida JWT, aplica control básico por roles, centraliza CORS, headers de seguridad, rate limit, logs, request ids y manejo de errores.

## Qué Hace

- Expone rutas públicas y protegidas bajo `/api/v1`.
- Reenvía requests a `auth-service`, `media-service`, `candidate-service`, `interview-service`, `evaluation-service` y `feedback-service`.
- Valida JWT con `JWT_SECRET`.
- Soporta `x-internal-service-token` para llamadas internas.
- Reenvía `Authorization`, `x-user-id`, `x-user-role`, `x-user-email`, `x-request-id` y token interno.
- Preserva multipart/form-data para uploads de media.
- Expone health checks del gateway y de servicios.

## Qué NO Hace

- No tiene base de datos.
- No usa Prisma.
- No usa Redis.
- No emite tokens.
- No contiene lógica de negocio de otros servicios.
- No transforma archivos ni procesa entrevistas.

## Arquitectura

- `config`: variables de entorno.
- `middlewares`: JWT, roles, request id, logs y errores.
- `proxy`: proxies por servicio con `http-proxy-middleware`.
- `routes`: health y rutas del gateway.
- `utils`: logger, async handler y respuestas estándar.

## Variables

Copia `.env.example` a `.env` para desarrollo local:

```bash
cp .env.example .env
```

Variables principales:

- `PORT=8080`
- `JWT_SECRET`: secreto compartido con `auth-service` para validar JWT.
- `JWT_ISSUER`, `JWT_AUDIENCE`: opcionales.
- `INTERNAL_SERVICE_TOKEN`: token opcional para llamadas internas.
- `AUTH_SERVICE_URL=http://localhost:3005`
- `MEDIA_SERVICE_URL=http://localhost:3000`
- `CANDIDATE_SERVICE_URL=http://localhost:3001`
- `INTERVIEW_SERVICE_URL=http://localhost:3002`
- `EVALUATION_SERVICE_URL=http://localhost:3003`
- `FEEDBACK_SERVICE_URL=http://localhost:3004`
- `CORS_ORIGIN=http://localhost:5173,http://localhost:3000`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=300`
- `JSON_BODY_LIMIT=10mb`
- `DEFAULT_PROXY_TIMEOUT_MS=120000`
- `MEDIA_PROXY_TIMEOUT_MS=300000`

## Ejecutar Localmente

```bash
cd api-gateway
npm install
npm run dev
```

El gateway queda en:

```text
http://localhost:8080
```

## Docker Compose

Desde la raíz del monorepo:

```bash
docker compose up --build api-gateway
```

En producción, el gateway debería ser el servicio expuesto públicamente. Los demás microservicios deben quedar en red interna.

## Mapeo de Rutas

- `http://localhost:8080/api/v1/auth/*` -> `AUTH_SERVICE_URL`
- `http://localhost:8080/api/v1/media/*` -> `MEDIA_SERVICE_URL`
- `http://localhost:8080/api/v1/candidates/*` -> `CANDIDATE_SERVICE_URL`
- `http://localhost:8080/api/v1/interviews/*` -> `INTERVIEW_SERVICE_URL`
- `http://localhost:8080/api/v1/evaluations/*` -> `EVALUATION_SERVICE_URL`
- `http://localhost:8080/api/v1/feedback/*` -> `FEEDBACK_SERVICE_URL`

## Rutas Públicas

- `GET /health`
- `GET /api/v1/health`
- `GET /api/v1/health/services`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

## Rutas Protegidas

Todo lo demás bajo `/api/v1` requiere:

```http
Authorization: Bearer <token>
```

o un token interno válido:

```http
x-internal-service-token: <token>
```

## JWT

El gateway valida tokens con `JWT_SECRET`. Claims soportados:

- `sub`
- `userId`
- `id`
- `role`
- `roles`
- `email`

Después de validar, agrega:

- `req.user`
- `x-user-id`
- `x-user-role`
- `x-user-email`

## Roles

Roles iniciales:

- `CANDIDATE`
- `ADMIN`
- `SERVICE`

MVP:

- `CANDIDATE` accede a media, candidate, interview, evaluation y feedback.
- `ADMIN` accede a todo.
- `SERVICE` accede con JWT de servicio o `x-internal-service-token`.

## Token Interno

Si `INTERNAL_SERVICE_TOKEN` está vacío, no bloquea por ese mecanismo. Si está definido, un servicio interno puede enviar:

```http
x-internal-service-token: <token>
```

El gateway lo marca como llamada `SERVICE`.

## Multipart

El parser JSON se salta requests `multipart/form-data`, por lo que:

```http
POST /api/v1/media/upload
```

pasa el stream completo a `media-service`.

## Postman

Health:

```http
GET http://localhost:8080/health
```

Health de servicios:

```http
GET http://localhost:8080/api/v1/health/services
```

Login:

```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password"
}
```

Upload media:

```http
POST http://localhost:8080/api/v1/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file=<archivo>
resourceType=VIDEO
interviewId=interview-123
ownerId=user-123
```

Para PDFs de CV, `interviewId` no es obligatorio:

```http
POST http://localhost:8080/api/v1/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file=<cv.pdf>
resourceType=PDF
ownerId=user-123
```

Acceso a media desde frontend:

```http
GET http://localhost:8080/api/v1/media/media-123/access
Authorization: Bearer <token>
```

La respuesta normaliza `accessUrl` para apuntar al API Gateway, no al `media-service`.

Rutas del usuario autenticado:

```http
GET http://localhost:8080/api/v1/me
GET http://localhost:8080/api/v1/me/profile
GET http://localhost:8080/api/v1/me/topics
GET http://localhost:8080/api/v1/me/reports
GET http://localhost:8080/api/v1/me/history
```

Crear perfil desde CV:

```http
POST http://localhost:8080/api/v1/candidates/profile/from-cv
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-123",
  "mediaId": "media-123",
  "targetRole": "Backend Developer",
  "level": "JUNIOR"
}
```

Consultar feedback:

```http
GET http://localhost:8080/api/v1/feedback/interviews/interview-123
Authorization: Bearer <token>
```

## CORS

`CORS_ORIGIN` acepta múltiples orígenes separados por coma. Headers permitidos:

- `Authorization`
- `Content-Type`
- `x-internal-service-token`
- `x-request-id`

## GCP

El gateway está preparado para correr como contenedor. En producción:

- Exponer solo `api-gateway` al tráfico externo.
- Mantener microservicios en red privada.
- Usar HTTPS detrás de Load Balancer o Cloud Run/API Gateway.
- Inyectar secretos con Secret Manager o variables seguras.
- No hardcodear hosts ni secretos.

## Errores Comunes

- `AUTH_TOKEN_REQUIRED`: falta `Authorization: Bearer`.
- `AUTH_TOKEN_INVALID`: JWT inválido o expirado.
- `JWT_SECRET_NOT_CONFIGURED`: falta configurar `JWT_SECRET`.
- `FORBIDDEN`: rol insuficiente.
- `UPSTREAM_UNAVAILABLE`: servicio destino caído o URL incorrecta.
- `UPSTREAM_TIMEOUT`: servicio destino tardó demasiado.
