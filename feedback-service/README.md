# feedback-service

`feedback-service` genera, almacena y expone el reporte final de una entrevista de CCInterview. Consume resultados ya calculados por `evaluation-service`, los transforma en feedback claro para frontend y persiste el reporte en el schema PostgreSQL `feedback`.

## Qué hace

- Recibe notificaciones cuando una evaluación está lista.
- Encola generación de reportes con Redis + BullMQ.
- Consulta resultados completos en `evaluation-service`.
- Enriquece opcionalmente con `candidate-service`.
- Usa OpenAI para redactar un reporte en español.
- Si OpenAI falla, genera un reporte heurístico local.
- Expone reportes por entrevista, usuario e id.

## Qué NO hace

- No evalúa respuestas.
- No transcribe audio.
- No analiza video.
- No calcula scores primarios.
- No genera PDF ni envía emails en esta versión.

## Flujo

1. `evaluation-service` llama `POST /feedback/evaluation-ready`.
2. Se crea o reutiliza un `FeedbackJob` idempotente por `interviewId`.
3. BullMQ encola el job con `jobId = interviewId`.
4. `feedback-worker` consulta `GET /evaluations/interviews/:interviewId`.
5. Opcionalmente consulta perfil y topics del candidato.
6. OpenAI redacta feedback estructurado en JSON.
7. Si OpenAI falla, se usa fallback heurístico.
8. Se guarda `FeedbackReport` y `FeedbackQuestionDetail`.
9. El job queda `COMPLETED` y el reporte `READY`.

## Arquitectura

- `controllers`: requests y responses.
- `services`: negocio de jobs, generación y consulta.
- `repositories`: Prisma/PostgreSQL.
- `clients`: HTTP hacia evaluation y candidate.
- `providers`: OpenAI.
- `workers`: cola, consumer y handler BullMQ.
- `middlewares`: errores y seguridad interna.
- `dto`: formato de respuesta para frontend.

## Variables de entorno

Copia `.env.example` a `.env` y configura tus valores:

```bash
cp .env.example .env
```

`OPENAI_API_KEY` debe ir solo en `.env` o en variables del entorno de despliegue:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Variables principales:

- `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5433/media_service?schema=feedback`
- `REDIS_URL`: `redis://localhost:6379`
- `FEEDBACK_QUEUE_NAME`: `feedback-jobs`
- `EVALUATION_SERVICE_URL`: `http://localhost:3002`
- `CANDIDATE_SERVICE_URL`: `http://localhost:3001`
- `ALLOW_READY_REPORT_REGENERATION`: `false`
- `INTERNAL_SERVICE_TOKEN`: si existe, exige `x-internal-service-token`

## Ejecutar localmente

```bash
cd feedback-service
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

En otra terminal:

```bash
npm run worker
```

## Docker Compose raíz

Desde la raíz del monorepo:

```bash
docker compose up --build feedback-service feedback-worker
```

El servicio usa la misma base `media_service`, separada por schema:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/media_service?schema=feedback
```

## Migraciones Prisma

Desarrollo:

```bash
npm run prisma:migrate
```

Deploy:

```bash
npm run prisma:deploy
```

La migración inicial crea solo el schema `feedback`.

## Postman

Notificación desde evaluation-service:

```http
POST http://localhost:3004/feedback/evaluation-ready
Content-Type: application/json

{
  "interviewId": "interview-123",
  "userId": "user-123",
  "evaluationId": "evaluation-123",
  "overallScore": 78
}
```

Generación manual:

```http
POST http://localhost:3004/feedback/generate
Content-Type: application/json

{
  "interviewId": "interview-123",
  "userId": "user-123"
}
```

Consultar estado:

```http
GET http://localhost:3004/feedback/jobs/interview-123/status
```

Consultar reporte:

```http
GET http://localhost:3004/feedback/interviews/interview-123
```

Listar reportes por usuario:

```http
GET http://localhost:3004/feedback/users/user-123/reports
```

Consultar por report id:

```http
GET http://localhost:3004/feedback/reports/report-123
```

Reintentar job fallido:

```http
POST http://localhost:3004/feedback/interviews/interview-123/retry
```

## Contrato con evaluation-service

Endpoint esperado:

```http
GET /evaluations/interviews/:interviewId
```

Debe devolver scores globales, `summary` y `questions` con scores y análisis por pregunta. `feedback-service` no recalcula esos scores: solo redacta y reorganiza.

## Contrato con candidate-service

Endpoints opcionales:

```http
GET /candidates/profile/:userId
GET /candidates/:userId/topics
```

Si fallan, se registra warning y el reporte se genera solo con datos de evaluation-service.

## Reporte generado

El endpoint de entrevista devuelve una estructura lista para frontend:

```json
{
  "interviewId": "string",
  "userId": "string",
  "status": "READY",
  "scores": {},
  "summary": {},
  "strengths": [],
  "improvementAreas": [],
  "recommendations": [],
  "sections": {},
  "multimodalObservations": [],
  "questions": []
}
```

## Fallback si OpenAI falla

Si `OPENAI_API_KEY` falta, OpenAI no responde o devuelve JSON inválido dos veces, el servicio crea un reporte heurístico local con scores, fortalezas, debilidades y recomendaciones existentes. El job no queda bloqueado por fallos de OpenAI.

## Frontend

El frontend debe usar:

- `status` para mostrar `GENERATING`, `READY` o `FAILED`.
- `scores` para gráficos.
- `sections` para pestañas técnico/soft skills/código/audio/video.
- `questions` para detalle por pregunta.

## GCP

El servicio está preparado para contenedores separados:

- `feedback-service`: HTTP.
- `feedback-worker`: BullMQ worker.

En producción:

- PostgreSQL puede ser Cloud SQL.
- Redis puede ser Memorystore.
- Secrets deben ir en Secret Manager o variables seguras.
- No hay hosts ni secretos hardcodeados.

## Errores comunes

- `Feedback job not found`: todavía no se notificó o generó ese `interviewId`.
- `evaluation-service response is incomplete`: la evaluación aún no está lista.
- `ECONNREFUSED`: revisar `EVALUATION_SERVICE_URL` o servicios levantados.
- `OPENAI_API_KEY` faltante: se usará fallback heurístico.
