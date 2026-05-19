# Candidate Service

Microservicio responsable de crear perfiles estructurados de candidatos desde CVs en PDF ya almacenados por `media-service`, persistir tematicas evaluables y devolver planes adaptativos para `interview-service`.

## Tecnologias

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- OpenAI API
- Docker

## Variables de entorno

Ver `.env.example`.

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/media_service?schema=candidate
MEDIA_SERVICE_URL=http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=
SOFT_SKILLS_LIMIT=5
ADAPTIVE_WEAK_SCORE_THRESHOLD=60
ADAPTIVE_COVERAGE_RATIO=0.7
ADAPTIVE_REINFORCEMENT_RATIO=0.3
ADAPTIVE_SOFT_SKILLS_RATIO=0.3
ADAPTIVE_MAX_CONSECUTIVE_SAME_TOPIC=1
```

`candidate-service` usa la misma base PostgreSQL local de `media-service`, pero separa sus tablas en el schema logico `candidate`.

## Levantar dependencias

Desde la raiz del monorepo:

```bash
docker compose up postgres redis gcs-emulator media-service media-worker
```

Para levantar tambien `candidate-service`:

```bash
OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-4.1-mini docker compose up candidate-service
```

## Migraciones Prisma

Desde `candidate-service`:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

En Docker, el compose ejecuta:

```bash
npx prisma generate && npm run prisma:deploy && npm start
```

La URL Docker esperada es:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/media_service?schema=candidate
```

## Ejecucion local

```bash
cd candidate-service
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

El servicio expone `GET /health` en `http://localhost:3001`.

## Flujo con media-service

1. El PDF se sube previamente a `media-service`.
2. `candidate-service` recibe `mediaId`.
3. Consulta `GET /media/:id` para validar metadata, tipo `PDF` y estado `READY`.
4. Consulta `GET /media/:id/access`.
5. Descarga el PDF desde `accessUrl` o desde `MEDIA_SERVICE_URL/media/:id/file`.
6. Envia el PDF a OpenAI para generar el perfil estructurado.

Contrato esperado de `media-service`:

- `GET /media/:id`
- `GET /media/:id/access`
- `GET /media/:id/file`

## Flujo con interview-service

`candidate-service` no genera preguntas. Devuelve un plan de evaluacion con `candidateTopicId`, `candidateSubtopicId`, tipo de skill, nivel esperado, prioridad y razon. `interview-service` usa ese plan para generar preguntas concretas y controlar repeticion con su propia logica.

## Flujo con evaluation-service

`evaluation-service` envia resultados por `candidateSubtopicId` a:

```http
POST /candidates/:userId/performance
```

El servicio guarda cada resultado y recalcula:

- `averageScore`
- `usageCount`
- `lastEvaluatedAt`
- `reinforce`

Tambien actualiza agregados del topic padre.

## OpenAI

El modelo se define con `OPENAI_MODEL`. La respuesta se solicita con JSON schema estricto e incluye:

- nombre completo si aparece
- resumen profesional
- seniority estimado
- roles objetivo sugeridos
- anos aproximados de experiencia
- habilidades tecnicas
- tecnologias
- dominios tecnicos
- tematicas y subtematicas evaluables
- evidencia breve basada en el CV

No se guarda el texto completo del CV. Se guarda solo el JSON estructurado y entidades normalizadas. Las soft skills no vienen del CV; se crean desde catalogo fijo.

## Probar con Postman

### Crear perfil desde mediaId

```http
POST http://localhost:3001/candidates/profile/from-cv
Content-Type: application/json
```

```json
{
  "userId": "user-123",
  "mediaId": "00000000-0000-0000-0000-000000000000",
  "targetRole": "Backend Developer",
  "level": "JUNIOR"
}
```

### Consultar perfil

```http
GET http://localhost:3001/candidates/profile/user-123
```

### Consultar topics y subtopics

```http
GET http://localhost:3001/candidates/user-123/topics
```

### Generar adaptive strategy

```http
GET http://localhost:3001/candidates/user-123/adaptive-strategy?questionCount=8&targetRole=Backend%20Developer&level=JUNIOR
```

Respuesta resumida:

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
      "topic": "Node.js",
      "subtopic": "Express routing",
      "expectedLevel": "BASIC",
      "priority": 1,
      "reason": "Not evaluated yet / coverage"
    }
  ]
}
```

### Actualizar performance

```http
POST http://localhost:3001/candidates/user-123/performance
Content-Type: application/json
```

```json
{
  "interviewId": "interview-123",
  "results": [
    {
      "candidateSubtopicId": "00000000-0000-0000-0000-000000000000",
      "questionId": "question-1",
      "score": 72,
      "evaluationType": "technical",
      "feedback": "Buen razonamiento, faltaron detalles de complejidad."
    }
  ]
}
```

## Errores comunes

- `Missing required environment variable: OPENAI_API_KEY`: define la API key antes de iniciar.
- `Missing required environment variable: OPENAI_MODEL`: define el modelo OpenAI.
- `PDF media is not ready yet`: el PDF existe en `media-service`, pero su estado no es `READY`.
- `mediaId must reference a PDF resource`: el recurso no es tipo `PDF`.
- `Some candidateSubtopicId values do not belong to this candidate profile`: `evaluation-service` envio un subtopic de otro usuario o inexistente.
- Error de conexion a PostgreSQL: revisa que el compose raiz este levantado y que `DATABASE_URL` use `schema=candidate`.
