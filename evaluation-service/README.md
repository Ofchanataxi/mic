# evaluation-service

`evaluation-service` procesa entrevistas finalizadas de MIC de forma asincrona. Recibe un `interviewId`, encola el trabajo con Redis + BullMQ, descarga el video completo desde `media-service`, corta audio por pregunta con FFmpeg, transcribe cada segmento con OpenAI, evalua la respuesta, ejecuta codigo con Judge0 y deja resultados estructurados para `feedback-service`.

## Flujo

1. `POST /evaluations/process` crea o reutiliza un `EvaluationJob`.
2. BullMQ encola el trabajo con `jobId = interviewId` para evitar duplicados.
3. `evaluation-worker` consulta `interview-service` en `GET /interviews/:interviewId/evaluation-data`.
4. Resuelve acceso al video con `media-service` si llega `mediaId`.
5. Descarga el video a `TEMP_PROCESSING_DIR/{interviewId}/source/video.mp4`.
6. Extrae un audio por pregunta en `segments/question-N.mp3`.
7. Transcribe con `OPENAI_TRANSCRIPTION_MODEL`.
8. Evalua semantica con `OPENAI_MODEL` y JSON estricto.
9. Calcula audio heuristico, video MVP extensible y codigo real con Judge0.
10. Guarda `QuestionEvaluation`, agregados globales e intenta actualizar `candidate-service` y notificar `feedback-service`.
11. Limpia temporales y marca el job `COMPLETED` o `FAILED`.

## Arquitectura

- `controllers`: validacion basica HTTP y responses.
- `services`: negocio de evaluacion, transcripcion, scoring y procesamiento.
- `repositories`: Prisma/PostgreSQL, solo schema `evaluation`.
- `clients`: HTTP hacia interview, media, candidate y feedback.
- `providers`: OpenAI, FFmpeg y video analysis provider.
- `workers`: queue, consumer y handler BullMQ.
- `middlewares`: errores e auth interna opcional.
- `utils`: logger, archivos, async handler y scores.

## Variables de entorno

Crea tu propio `.env` desde `.env.example`. No se debe commitear `.env`.

```bash
cp .env.example .env
```

Configura `OPENAI_API_KEY` con tu propia clave:

```env
OPENAI_API_KEY=
```

Variables principales:

- `DATABASE_URL`: local `postgresql://postgres:postgres@localhost:5433/media_service?schema=evaluation`.
- `REDIS_URL`: local `redis://localhost:6379`.
- `INTERVIEW_SERVICE_URL`, `MEDIA_SERVICE_URL`, `CANDIDATE_SERVICE_URL`, `FEEDBACK_SERVICE_URL`.
- `OPENAI_MODEL`: modelo de evaluacion textual, por defecto `gpt-4o-mini`.
- `OPENAI_TRANSCRIPTION_MODEL`: modelo de transcripcion, por defecto `whisper-1`.
- `JUDGE0_API_KEY`: clave RapidAPI/Judge0. Debe ir solo en `.env`, nunca en codigo.
- `JUDGE0_API_URL`: URL base de Judge0, por defecto `https://judge0-ce.p.rapidapi.com`.
- `JUDGE0_API_HOST`: host RapidAPI, por defecto `judge0-ce.p.rapidapi.com`.
- `TEMP_PROCESSING_DIR`: almacenamiento temporal, se limpia al finalizar.
- `INTERNAL_SERVICE_TOKEN`: si se define, exige header `x-internal-service-token`.

## Ejecutar localmente

```bash
cd evaluation-service
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

En otra terminal:

```bash
npm run worker
```

FFmpeg debe estar instalado localmente y accesible en `PATH`.

## Docker Compose raiz

Desde la raiz del monorepo:

```bash
docker compose up --build evaluation-service evaluation-worker
```

El compose usa la misma base `media_service` y el schema `evaluation`:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/media_service?schema=evaluation
```

Si `interview-service`, `candidate-service` o `feedback-service` aun no estan en `docker-compose.yml`, las URLs quedan preparadas y los contenedores deberan agregarse cuando esos servicios esten disponibles.

## Migraciones Prisma

Desarrollo:

```bash
npm run prisma:migrate
```

Despliegue:

```bash
npm run prisma:deploy
```

La migracion inicial crea el schema `evaluation` y sus tablas. No modifica tablas de otros servicios.

## Postman

Encolar evaluacion:

```http
POST http://localhost:3002/evaluations/process
Content-Type: application/json

{
  "interviewId": "interview-123",
  "userId": "user-123"
}
```

Consultar estado:

```http
GET http://localhost:3002/evaluations/jobs/interview-123/status
```

Consultar resultado:

```http
GET http://localhost:3002/evaluations/interviews/interview-123
```

Consultar preguntas:

```http
GET http://localhost:3002/evaluations/interviews/interview-123/questions
```

Reintentar job fallido:

```http
POST http://localhost:3002/evaluations/interviews/interview-123/retry
```

Health:

```http
GET http://localhost:3002/health
```

## Contrato con interview-service

Endpoint esperado:

```http
GET /interviews/:interviewId/evaluation-data
```

Debe devolver `status: "FINISHED"`, `mediaId` o `videoAccessUrl`, y `questions` con `questionId`, `questionText`, `skillType`, `startTimeMs` y `endTimeMs`. `evaluation-service` no inventa preguntas ni modifica timestamps.

## Contrato con media-service

Endpoints esperados:

```http
GET /media/:id
GET /media/:id/access
```

`/access` debe devolver:

```json
{
  "mediaId": "string",
  "accessUrl": "string",
  "expiresAt": null
}
```

El servicio nunca accede directo a GCS ni guarda video permanentemente.

## Contrato con candidate-service

Endpoint esperado:

```http
POST /candidates/:userId/performance
```

Se envian resultados por pregunta solo cuando existe `candidateSubtopicId`, usando `evaluationType: "FINAL_QUESTION_SCORE"`. Tambien se envia `overall`; si el servicio aun no acepta ese campo, puede ignorarlo o ajustar temporalmente el contrato para aceptar solo `results`.

## Contrato con feedback-service

Endpoint futuro:

```http
POST /feedback/evaluation-ready
```

Si falla, se registra warning y el job no falla. Los resultados quedan consultables por REST.

## Transcripcion por segmentos

El video completo se descarga una vez. Luego FFmpeg corta audio por pregunta usando `startTimeMs` y `endTimeMs`. Solo el audio segmentado se envia a OpenAI, nunca el video completo.

## FFmpeg

El Dockerfile usa `node:20-slim` e instala `ffmpeg`. Localmente debes tener `ffmpeg` y `ffprobe` en `PATH`.

## Judge0

Para preguntas `CODE`, el servicio usa Judge0 real. `JUDGE0_API_KEY` es obligatoria para evaluar codigo. La clave debe colocarse en tu `.env` local:

```env
JUDGE0_API_KEY=
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

No subas esa clave a GitHub. Si `JUDGE0_API_KEY` no existe o Judge0 falla, la pregunta `CODE` se marca como `FAILED` y el worker continua con las demas preguntas.

Comportamiento:

- Envia `sourceCode`, `stdin`, `language` y `expectedOutput` a Judge0.
- Usa `wait=true` para recibir el resultado en la misma llamada.
- Guarda `simulated=false` y `rawData.status = "JUDGE0_EXECUTED"`.
- Si `expectedOutput` existe, compara `stdout` contra ese valor normalizado.

## Video analysis MVP

No se inventa contacto visual, postura ni comportamiento facial. El provider retorna scores `null` y `rawData.status = "VIDEO_MODEL_NOT_CONFIGURED"`. El orquestador ignora `videoScore=null`.

## GCP

El servicio esta preparado para desplegar server y worker como procesos separados. En produccion:

- PostgreSQL puede ser Cloud SQL.
- Redis puede ser Memorystore.
- El video debe seguir resolviendose via `media-service`.
- No se usan rutas absolutas locales.
- No se hardcodean hosts ni secretos.
- Los archivos temporales deben vivir en almacenamiento efimero del runtime.

## Errores comunes

- `OPENAI_API_KEY is required`: falta configurar `.env`.
- `FFmpeg is not available`: instalar FFmpeg localmente o usar Docker.
- `Interview must be FINISHED`: la entrevista aun no esta lista para evaluacion.
- `Interview has no mediaId or videoAccessUrl`: `interview-service` no entrego referencia de video.
- `ECONNREFUSED` hacia otros servicios: validar URLs y que los servicios esten levantados.
