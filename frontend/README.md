# MIC Frontend

Base funcional del frontend React para la plataforma de entrevistas tecnicas multimodales.

## Tecnologias

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios
- lucide-react
- @monaco-editor/react

## Variables de entorno

Crear `.env` desde `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

El frontend debe consumir siempre API Gateway. No debe llamar directamente a `media-service`, `candidate-service`, `interview-service`, `evaluation-service` ni `feedback-service`.

## Instalacion

```bash
cd frontend
npm install
```

## Desarrollo local

```bash
npm run dev
```

URL por defecto:

```text
http://localhost:5173
```

Antes de usar la app, levanta el backend desde la raiz:

```bash
docker compose up
```

## Rutas principales

Publicas:

- `/login`
- `/register`

Privadas:

- `/inicio`
- `/profile`
- `/cv`
- `/interviews/new`
- `/interviews/:id/session`
- `/interviews/:id/processing`
- `/interviews/:id/feedback`
- `/history`

## Flujo completo de CV

La pantalla `/cv` implementa:

1. Seleccion de PDF.
2. Upload a API Gateway:

```http
POST /api/v1/media/upload
```

Campos multipart:

- `file`
- `resourceType=PDF`
- `ownerId=<userId del JWT>`

3. Creacion de perfil:

```http
POST /api/v1/candidates/profile/from-cv
```

Body enviado por el frontend:

```json
{
  "userId": "uuid",
  "mediaId": "uuid",
  "targetRole": "Backend Developer",
  "level": "JUNIOR"
}
```

Nota: el usuario no escribe `userId`; se toma de la sesion. Cuando el gateway tenga un endpoint `/me/profile/from-cv`, el body puede reducirse a `mediaId`.

## Flujo de entrevista

La pantalla `/interviews/new` crea entrevistas con:

```http
POST /api/v1/interviews
```

Luego redirige a:

```text
/interviews/:id/session
```

La sesion real hace:

1. Consulta `GET /api/v1/interviews/:id`.
2. Muestra instrucciones previas.
3. Solicita camara y microfono con `navigator.mediaDevices.getUserMedia`.
4. Inicia backend con `POST /api/v1/interviews/:id/start`.
5. Inicia `MediaRecorder` en navegador.
6. Presenta preguntas secuenciales ya generadas por backend.
7. Usa textarea para `TECHNICAL` y `SOFT_SKILL`.
8. Usa Monaco Editor para `CODING`.
9. Registra timestamps relativos al inicio del video.
10. Al finalizar detiene grabacion, sube video y cierra entrevista.

## MediaRecorder

- La grabacion es continua.
- No se suben chunks parciales.
- Los chunks se mantienen en memoria hasta finalizar.
- Si falla upload o finish, se puede reintentar mientras la pestana siga abierta.
- No se guarda video localmente de forma persistente.

## Monaco Editor

Las preguntas `CODING` usan `@monaco-editor/react`.

El frontend guarda:

```json
{
  "codeSubmission": {
    "language": "javascript",
    "code": "..."
  }
}
```

No ejecuta codigo ni evalua respuestas.

## Timestamps

Por cada pregunta se construye:

```json
{
  "questionId": "uuid",
  "answerText": "string",
  "videoStartMs": 0,
  "videoEndMs": 12000,
  "answerStartedAt": "datetime",
  "answerEndedAt": "datetime",
  "codeSubmission": null
}
```

`videoStartMs` y `videoEndMs` se calculan con `performance.now()` relativo al inicio de la grabacion.

## Upload de video y cierre

Al finalizar:

```http
POST /api/v1/media/upload
```

Campos multipart:

- `file=<interview.webm>`
- `resourceType=VIDEO`
- `ownerId=<userId>`
- `interviewId=<interviewId>`

Luego:

```http
POST /api/v1/interviews/:id/finish
```

Body:

```json
{
  "videoMediaId": "uuid",
  "responses": []
}
```

Despues redirige a:

```text
/interviews/:id/processing
```

## Endpoints usados

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/me`
- `GET /api/v1/me/profile`
- `GET /api/v1/me/topics`
- `GET /api/v1/me/history`
- `POST /api/v1/media/upload`
- `GET /api/v1/media/:id/access`
- `POST /api/v1/candidates/profile/from-cv`
- `POST /api/v1/interviews`
- `GET /api/v1/interviews/:id`
- `POST /api/v1/interviews/:id/start`
- `POST /api/v1/interviews/:id/finish`
- `GET /api/v1/evaluations/jobs/:interviewId/status`
- `GET /api/v1/evaluations/interviews/:interviewId`
- `GET /api/v1/evaluations/interviews/:interviewId/questions`
- `GET /api/v1/feedback/jobs/:interviewId/status`
- `GET /api/v1/feedback/interviews/:interviewId`
- `GET /api/v1/feedback/reports/:reportId`
- `GET /api/v1/media/:mediaId/access`

## Flujo de procesamiento

La ruta `/interviews/:id/processing` consulta:

- `GET /api/v1/evaluations/jobs/:interviewId/status`
- `GET /api/v1/feedback/jobs/:interviewId/status`

Hace polling cada 5 segundos y se detiene cuando:

- feedback queda `READY`
- evaluation falla
- feedback falla

La pantalla muestra estas etapas:

- Entrevista enviada
- Evaluacion en proceso
- Feedback en generacion
- Reporte disponible

No invoca endpoints internos de retry.

## Feedback detallado

La ruta `/interviews/:id/feedback` consulta:

- feedback por entrevista
- evaluacion por entrevista
- preguntas evaluadas
- metadata de entrevista para resolver `videoMediaId`
- access URL de media via API Gateway

La UI normaliza respuestas de evaluation y feedback en `src/utils/feedbackNormalizer.js`.

Estructura normalizada:

```js
{
  interviewId,
  videoMediaId,
  overallScore,
  scores,
  summary,
  strengths,
  weaknesses,
  recommendations,
  questions
}
```

El frontend no recalcula scores ni infiere resultados: solo muestra datos devueltos por backend.

## Video segmentado

`SegmentedVideoPlayer` carga el video completo usando:

```http
GET /api/v1/media/:mediaId/access
```

Luego usa `startTimeMs` y `endTimeMs` de cada pregunta para:

- mover `video.currentTime` al inicio del segmento
- reproducir el segmento
- pausar automaticamente al llegar al fin
- reiniciar segmento
- permitir ver el video completo

No corta archivos ni procesa video en frontend.

## Historial

La ruta `/history` consume:

```http
GET /api/v1/me/history
```

Muestra fecha, rol, nivel, estados, score global y acciones:

- Continuar procesamiento
- Ver feedback
- Ver entrevista

## Implementado

- Configuracion React + Vite.
- Tailwind CSS.
- Routing publico y protegido.
- Layout tipo dashboard con sidebar y topbar.
- Auth basica con `accessToken` y `refreshToken` en localStorage.
- Cliente HTTP centralizado hacia API Gateway.
- API clients por dominio.
- Login y registro.
- Página de inicio.
- Perfil con consumo de `/api/v1/me/profile` y `/api/v1/me/topics`.
- Carga real de CV PDF usando API Gateway.
- Creacion real de perfil.
- Creacion real de entrevista.
- Sesion real con camara, microfono y `MediaRecorder`.
- Preguntas secuenciales.
- Monaco Editor para preguntas `CODING`.
- Timestamps por pregunta.
- Upload real del video completo.
- Finish real de entrevista.
- Procesamiento con polling.
- Feedback detallado con resumen, scores, preguntas y video segmentado.
- Historial funcional consumiendo `/api/v1/me/history`.

## Limitaciones actuales

- El frontend aun envia `userId` en algunos payloads porque los endpoints backend actuales lo requieren internamente.
- El video se conserva solo en memoria durante el cierre; si se cierra la pestana despues de grabar y antes de finalizar, se pierde.
- La advertencia de salida usa `beforeunload`; no bloquea cambios de pestana.
- No hay reanudacion de entrevista.
- El polling no usa websockets ni server-sent events.
- El feedback muestra solo campos disponibles en backend; si una dimension no llega, se omite.

## Pendiente para fase 3

- Historial enriquecido.
- Página de inicio final.
- Reproduccion con marcadores visuales por pregunta.
- Mejoras de accesibilidad y responsive fino para pantallas pequenas.
- Mejoras de seguridad para almacenamiento de tokens.

## Docker Compose

El `docker-compose.yml` raiz incluye un servicio `frontend` en el puerto `5173`.

```bash
docker compose up frontend
```

El contenedor usa:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```
