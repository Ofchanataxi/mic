# interview-service

Microservicio responsable de crear y administrar entrevistas tecnicas multimodales. Consume el plan adaptativo de `candidate-service`, genera preguntas con OpenAI, guarda la entrevista predefinida, recibe respuestas al final y expone el payload completo que `evaluation-service` necesita para procesar la evaluacion.

## Responsabilidades

- Crear entrevistas para un candidato.
- Consultar el plan adaptativo de `candidate-service`.
- Generar preguntas una sola vez al crear la entrevista.
- Guardar preguntas, respuestas, timestamps y `videoMediaId`.
- Evitar preguntas repetidas por candidato usando embeddings en JSON.
- Notificar a `evaluation-service` cuando la entrevista termina, si el dispatch esta habilitado.
- Exponer un payload interno para evaluacion.

## Lo que no hace

- No evalua respuestas.
- No procesa video.
- No transcribe audio.
- No genera feedback.
- No contiene banco de preguntas.
- No incluye `starterCode`, `expectedOutput` ni logica especifica de Judge0.

## Tecnologias

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- OpenAI API
- Docker Compose

## Variables de entorno

```env
PORT=3002
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/media_service?schema=interview
CANDIDATE_SERVICE_URL=http://localhost:3001
EVALUATION_SERVICE_URL=http://localhost:3003
ENABLE_EVALUATION_DISPATCH=false
OPENAI_API_KEY=
OPENAI_QUESTION_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
DEFAULT_QUESTION_COUNT=8
MIN_QUESTION_COUNT=5
MAX_QUESTION_COUNT=12
QUESTION_GENERATION_MAX_ATTEMPTS=3
QUESTION_SIMILARITY_THRESHOLD=0.85
HTTP_CLIENT_TIMEOUT_MS=30000
```

En Docker, `DATABASE_URL` debe apuntar a `postgres:5432`:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/media_service?schema=interview
```

## Dependencias con Docker Compose

Desde la raiz del monorepo:

```bash
docker compose up postgres candidate-service interview-service
```

Para levantar todo el flujo:

```bash
docker compose up
```

El servicio reutiliza el contenedor `postgres` existente, la base `media_service` y crea sus tablas en el schema logico `interview`.

## Migraciones Prisma

Local:

```bash
cd interview-service
npm install
npx prisma generate
npm run prisma:migrate
```

Docker:

```bash
docker compose run --rm interview-service npm run prisma:deploy
```

El `docker-compose.yml` raiz ya ejecuta `npx prisma generate && npm run prisma:deploy && npm start` al iniciar el contenedor.

## Ejecucion local

```bash
cd interview-service
npm install
copy .env.example .env
npx prisma generate
npm run prisma:migrate
npm run dev
```

Requiere `OPENAI_API_KEY` para crear entrevistas, porque la generacion de preguntas y embeddings es real.

## Endpoints

### Health

```http
GET http://localhost:3002/health
```

### Crear entrevista

```http
POST http://localhost:3002/interviews
Content-Type: application/json
```

```json
{
  "userId": "user-123",
  "candidateProfileId": "9c7ad48d-4519-4a4a-9e76-3c62518a3f63",
  "targetRole": "Backend Developer",
  "level": "JUNIOR",
  "questionCount": 8
}
```

Respuesta:

```json
{
  "interviewId": "uuid",
  "status": "CREATED",
  "questionCount": 8,
  "questions": []
}
```

### Iniciar entrevista

```http
POST http://localhost:3002/interviews/{interviewId}/start
```

```json
{
  "interviewId": "uuid",
  "status": "IN_PROGRESS"
}
```

### Finalizar entrevista

```http
POST http://localhost:3002/interviews/{interviewId}/finish
Content-Type: application/json
```

```json
{
  "videoMediaId": "video-media-123",
  "responses": [
    {
      "questionId": "question-uuid-1",
      "answerText": "Explique el flujo de control usando condicionales y bucles...",
      "videoStartMs": 0,
      "videoEndMs": 12000,
      "answerStartedAt": "2026-05-24T20:00:00.000Z",
      "answerEndedAt": "2026-05-24T20:00:12.000Z"
    },
    {
      "questionId": "question-uuid-2",
      "answerText": "Resolveria el problema recorriendo el arreglo una vez.",
      "videoStartMs": 12000,
      "videoEndMs": 35000,
      "codeSubmission": {
        "language": "javascript",
        "code": "function sum(values) { return values.reduce((a, b) => a + b, 0); }"
      }
    }
  ]
}
```

La entrevista queda `FINISHED` aunque falle la notificacion a `evaluation-service`. En ese caso `evaluationStatus` queda `DISPATCH_FAILED`.

### Consultar entrevista

```http
GET http://localhost:3002/interviews/{interviewId}
```

Devuelve metadata y preguntas, sin expandir el payload completo de evaluacion.

### Consultar payload de evaluacion

```http
GET http://localhost:3002/interviews/{interviewId}/evaluation-payload
```

Tambien existe el alias:

```http
GET http://localhost:3002/interviews/{interviewId}/evaluation-data
```

Ejemplo de respuesta:

```json
{
  "interviewId": "uuid",
  "userId": "user-123",
  "candidateProfileId": "9c7ad48d-4519-4a4a-9e76-3c62518a3f63",
  "targetRole": "Backend Developer",
  "level": "JUNIOR",
  "videoMediaId": "video-media-123",
  "startedAt": "2026-05-24T20:00:00.000Z",
  "finishedAt": "2026-05-24T20:20:00.000Z",
  "questions": [
    {
      "questionId": "uuid",
      "candidateTopicId": "uuid",
      "candidateSubtopicId": "uuid",
      "skillType": "TECHNICAL",
      "topic": "Python",
      "subtopic": "Control structures",
      "questionType": "TECHNICAL",
      "prompt": "Explica...",
      "language": null,
      "expectedLevel": "BASIC",
      "orderIndex": 1,
      "response": {
        "answerText": "Respuesta...",
        "videoStartMs": 0,
        "videoEndMs": 12000,
        "answerStartedAt": "2026-05-24T20:00:00.000Z",
        "answerEndedAt": "2026-05-24T20:00:12.000Z",
        "codeSubmission": null
      }
    }
  ]
}
```

## Flujo con candidate-service

Al crear una entrevista, `interview-service` llama:

```http
GET /candidates/:userId/adaptive-strategy?questionCount=8&targetRole=Backend%20Developer&level=JUNIOR
```

Contrato esperado:

```json
{
  "userId": "user-123",
  "candidateProfileId": "uuid",
  "questionCount": 8,
  "targetRole": "Backend Developer",
  "level": "JUNIOR",
  "evaluationPlan": [
    {
      "candidateTopicId": "uuid",
      "candidateSubtopicId": "uuid",
      "skillType": "TECHNICAL",
      "topic": "Python",
      "subtopic": "Control structures",
      "expectedLevel": "BASIC",
      "priority": 1,
      "reason": "Coverage"
    }
  ]
}
```

`candidate-service` decide que evaluar. `interview-service` decide la pregunta concreta.

## Flujo con media-service

`interview-service` no sube ni procesa video. El frontend debe subir el video a `media-service`, recibir un `videoMediaId` y enviarlo al cerrar la entrevista en `POST /interviews/:id/finish`.

## Flujo con evaluation-service

Si `ENABLE_EVALUATION_DISPATCH=true`, al finalizar la entrevista se llama:

```http
POST /evaluations/interviews
Content-Type: application/json
```

```json
{
  "interviewId": "uuid"
}
```

Si `ENABLE_EVALUATION_DISPATCH=false`, no se llama a `evaluation-service` y `evaluationStatus` queda `NOT_REQUESTED`.

## Control de preguntas repetidas

Cada pregunta generada se transforma en embedding con `OPENAI_EMBEDDING_MODEL`. El vector se guarda como JSON en PostgreSQL en el schema `interview`. Antes de aceptar una pregunta, el servicio calcula similitud coseno contra preguntas previas del mismo `userId` y contra las ya generadas en la entrevista actual. Si la similitud es mayor o igual a `QUESTION_SIMILARITY_THRESHOLD`, reintenta hasta `QUESTION_GENERATION_MAX_ATTEMPTS`. Si todos los intentos son similares, acepta la pregunta menos similar y registra los intentos.

## Notas OpenAI

- `OPENAI_QUESTION_MODEL` genera JSON estructurado con `questionType`, `prompt` y `language`.
- `OPENAI_EMBEDDING_MODEL` genera el embedding del prompt.
- Sin `OPENAI_API_KEY`, el servicio puede iniciar y responder `/health`, pero `POST /interviews` fallara.

## Errores comunes

- `candidate-service is not reachable`: levanta `candidate-service` o revisa `CANDIDATE_SERVICE_URL`.
- `OPENAI_API_KEY is required`: configura una API key valida antes de crear entrevistas.
- `Only CREATED interviews can be started`: la entrevista ya fue iniciada, finalizada o cancelada.
- `Only IN_PROGRESS interviews can be finished`: llama primero a `/start`.
- `All interview questions must have a response`: el frontend debe enviar una respuesta por cada pregunta.
- Conflicto de puertos: en este compose, `interview-service` usa `3002` y `evaluation-service` usa `3003`.
