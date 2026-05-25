# Frontend Final Alignment Report

## 1. Resumen ejecutivo

El frontend React + Vite esta alineado en lo esencial con el contrato actual del API Gateway y con el flujo funcional completo del candidato. Las llamadas de aplicacion pasan por `httpClient`, que usa `VITE_API_BASE_URL` y rutas relativas bajo `/api/v1`. No se encontraron llamadas directas desde `frontend/src` a `media-service`, `candidate-service`, `interview-service`, `evaluation-service`, `feedback-service` ni `auth-service`.

El flujo principal esta implementado:

- Login/registro y proteccion de rutas.
- Upload de CV por API Gateway.
- Creacion de perfil.
- Consulta de perfil/topics via rutas `/me`.
- Creacion de entrevista.
- Sesion con `getUserMedia`, `MediaRecorder`, preguntas secuenciales, Monaco para `CODING`, timestamps y cierre con video.
- Procesamiento con polling.
- Historial via `/me/history`.
- Feedback detallado con normalizacion defensiva y video segmentado por timestamps.

No hay un bloqueo de frontend que impida probar el flujo end-to-end si el backend esta levantado y configurado con dependencias externas requeridas, especialmente OpenAI y workers. Si conviene hacer una ronda de ajustes antes de darlo por cerrado, los puntos principales son de robustez de edge cases: limpieza de camara si falla `startInterview`, advertencia de salida tambien durante `finishing`, y mayor visibilidad de errores parciales en polling.

Verificaciones ejecutadas:

- `npm run build` en `frontend`: OK.
- `docker compose config`: OK. Docker mantiene un warning local por acceso a `C:\Users\mrcolina\.docker\config.json`, pero el comando termina con exit code 0.

## 2. Rutas frontend revisadas

| Ruta | Estado | Observaciones |
|---|---|---|
| `/login` | OK | Login con email/password, guarda tokens y redirige a dashboard. |
| `/register` | OK | Registro con firstName, lastName, email, password. Si backend devuelve tokens, inicia sesion. |
| `/dashboard` | OK | Pantalla inicial con accesos a CV, entrevista, historial y feedback. |
| `/cv` | OK | Sube PDF y crea perfil usando API Gateway. |
| `/profile` | OK | Consume `/me/profile` y `/me/topics`; maneja 404 como perfil inexistente. |
| `/interviews/new` | OK | Crea entrevista real y redirige a sesion. |
| `/interviews/:id/session` | OK con recomendaciones | Carga preguntas, inicia entrevista, graba, registra timestamps, sube video y finaliza. |
| `/interviews/:id/processing` | OK | Polling cada 5 segundos para evaluation y feedback. |
| `/history` | OK | Consume `/me/history`, muestra cards y acciones. |
| `/interviews/:id/feedback` | OK con dependencia de datos backend | Consulta feedback/evaluation/interview/media y muestra detalle con video segmentado si hay video/timestamps. |

## 3. Endpoints usados por pantalla

### Auth

Usados por `authApi`:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`

Estado: OK.

Notas:

- `accessToken` y `refreshToken` se guardan en `localStorage`.
- `Authorization: Bearer <accessToken>` se agrega con interceptor.
- El refresh usa `API_BASE_URL/auth/refresh`, no microservicios directos.
- Si no hay refresh token ante 401, se limpian tokens.

### `/cv`

Endpoints:

- `POST /api/v1/media/upload`
- `POST /api/v1/candidates/profile/from-cv`

Payload efectivo:

- Upload PDF: `file`, `resourceType=PDF`, `ownerId=<userId>`.
- Crear perfil: `userId`, `mediaId`, `targetRole`, `level`.

Estado: OK.

Nota: el frontend no pide `userId` al usuario; lo toma de la sesion. Sigue enviandolo porque el endpoint backend actual lo requiere.

### `/profile`

Endpoints:

- `GET /api/v1/me/profile`
- `GET /api/v1/me/topics`

Estado: OK.

### `/interviews/new`

Endpoint:

- `POST /api/v1/interviews`

Payload:

- `userId`
- `candidateProfileId`
- `targetRole`
- `level`
- `questionCount`

Estado: OK.

Nota: igual que en CV, `userId` se toma de la sesion porque el backend actual lo requiere.

### `/interviews/:id/session`

Endpoints:

- `GET /api/v1/interviews/:id`
- `POST /api/v1/interviews/:id/start`
- `POST /api/v1/media/upload`
- `POST /api/v1/interviews/:id/finish`

Estado: OK con recomendaciones.

Validaciones:

- Carga preguntas desde backend.
- Inicia entrevista antes de grabar respuestas.
- Usa `navigator.mediaDevices.getUserMedia`.
- Usa `MediaRecorder` continuo.
- Usa Monaco para `questionType=CODING`.
- Guarda respuestas por `questionId`.
- Registra `videoStartMs` al mostrar pregunta y `videoEndMs` al avanzar/finalizar.
- Sube un unico `webm` final con `resourceType=VIDEO` e `interviewId`.
- Finaliza con `videoMediaId` y `responses`.
- Redirige a `/interviews/:id/processing`.

Riesgos:

- Si `getUserMedia` funciona pero `startInterview` falla, el stream podria quedar activo hasta desmontar la pagina.
- `beforeunload` solo advierte durante fase `recording`; durante `finishing` o `finish-error` el video puede seguir siendo critico.
- No hay bloqueo de navegacion interna de React Router durante una entrevista activa, solo `beforeunload` del navegador.

### `/interviews/:id/processing`

Endpoints:

- `GET /api/v1/evaluations/jobs/:interviewId/status`
- `GET /api/v1/feedback/jobs/:interviewId/status`

Estado: OK.

Comportamiento:

- Polling cada 5 segundos.
- Se detiene si feedback esta `READY`.
- Se detiene si evaluation o feedback fallan.
- Permite reintentar consulta.
- No invoca endpoints internos de retry.

Riesgo menor:

- Si solo uno de los dos endpoints falla, la pantalla no muestra explicitamente ese fallo parcial salvo que venga como `errorMessage` en el status disponible.

### `/history`

Endpoint:

- `GET /api/v1/me/history`

Estado: OK.

Muestra:

- Fecha.
- Target role.
- Nivel.
- `interviewStatus`.
- `feedbackStatus`.
- Score global si existe.
- Acciones a procesamiento y feedback.

### `/interviews/:id/feedback`

Endpoints:

- `GET /api/v1/feedback/interviews/:interviewId`
- `GET /api/v1/evaluations/interviews/:interviewId`
- `GET /api/v1/evaluations/interviews/:interviewId/questions`
- `GET /api/v1/interviews/:id`
- `GET /api/v1/media/:mediaId/access`

Estado: OK con dependencia de datos backend.

Validaciones:

- Consulta feedback y evaluation.
- Consulta preguntas evaluadas.
- Obtiene `videoMediaId` desde feedback/evaluation/interview cuando existe.
- Obtiene `accessUrl` via API Gateway.
- Usa `SegmentedVideoPlayer` para mover `currentTime` a `startTimeMs / 1000`.
- Pausa automaticamente al llegar a `endTimeMs / 1000`.
- Muestra resumen, scores, fortalezas, mejoras y recomendaciones.
- Muestra detalle por pregunta: pregunta, respuesta, transcripcion, scores, analisis semantico/audio/video/codigo.

Limitacion de datos:

- El frontend soporta `topic` y `subtopic`, pero los endpoints actuales pueden no entregar nombres de topic/subtopic en la respuesta final. El normalizer es defensivo y no rompe la UI.
- Si `videoMediaId` o timestamps faltan, la pantalla muestra feedback pero no puede reproducir segmento.

## 4. Consumo de API Gateway

Resultado: OK.

Evidencia:

- `frontend/src/api/httpClient.js` centraliza Axios con `baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'`.
- Los API clients usan rutas relativas: `/auth`, `/me`, `/media`, `/candidates`, `/interviews`, `/evaluations`, `/feedback`.
- Busqueda en `frontend/src` no encontro URLs directas a puertos internos `3000`-`3005`.
- El unico fallback hardcoded es `http://localhost:8080/api/v1`, que sigue siendo API Gateway.

Endpoints internos bloqueados por gateway:

- `POST /candidates/:userId/performance`
- `GET /interviews/:id/evaluation-payload`
- `GET /interviews/:id/evaluation-data`
- `POST /evaluations/process`
- `POST /feedback/evaluation-ready`
- `POST /feedback/generate`

Resultado: OK. No se encontraron usos de esos endpoints en frontend.

## 5. Auth y rutas privadas

Resultado: OK.

- `AuthProvider` bootstrapea sesion con token existente.
- `ProtectedRoute` redirige a `/login` si no hay token.
- `PublicRoute` redirige a `/dashboard` si hay sesion.
- Las rutas privadas estan dentro de `ProtectedRoute` y `AppLayout`.
- Logout limpia tokens localmente incluso si falla el request remoto.

Recomendacion:

- Para produccion, migrar tokens a un mecanismo mas seguro que `localStorage` o agregar mitigaciones XSS. No bloquea la fase actual.

## 6. Docker Compose y build

Resultado: OK.

- `docker-compose.yml` incluye `frontend`.
- Puerto: `5173:5173`.
- Env: `VITE_API_BASE_URL=http://localhost:8080/api/v1`.
- Depende de `api-gateway`.
- `npm run build` compila.
- `docker compose config` valida.

Observacion:

- El contenedor de frontend corre `npm run dev`, adecuado para desarrollo. Para produccion faltaria un build estatico servido por Nginx u otro servidor.

## 7. Problemas encontrados

### Alto

Ninguno que bloquee la prueba funcional end-to-end del frontend si backend y workers estan configurados.

### Medio

1. Stream de camara si falla `startInterview`.
   - En sesion, `getUserMedia` se ejecuta antes de `startInterview`. Si `startInterview` falla, el catch vuelve a instrucciones pero no detiene explicitamente tracks.
   - Impacto: la camara/microfono podrian quedar activos hasta desmontar la pagina.

2. Advertencia de salida incompleta.
   - `beforeunload` cubre fase `recording`, pero no `finishing` ni `finish-error`.
   - Impacto: cerrar durante subida/finalizacion puede perder el video en memoria.

3. Datos de topic/subtopic pueden no mostrarse en feedback.
   - El frontend esta preparado, pero los endpoints backend pueden no devolver nombres de topic/subtopic en feedback/evaluation.
   - Impacto: el detalle por pregunta puede quedar menos contextual.

4. Polling con errores parciales poco visible.
   - Si solo falla un endpoint de status y el otro responde, no siempre se muestra un error parcial.
   - Impacto: usuario puede ver una etapa como pendiente sin saber que un endpoint fallo.

### Bajo

1. `doneStatuses` en `ProcessingPage` esta declarado y no se usa.
   - Impacto: limpieza menor.

2. Copy desactualizado en `/interviews/new`.
   - Aun dice que la sesion con camara se implementara despues, aunque ya esta implementada.
   - Impacto: confusion menor en UI.

3. `VITE_API_BASE_URL` tiene fallback hardcoded.
   - El fallback apunta al gateway, asi que no rompe arquitectura.
   - Para entornos no locales conviene exigir variable explicitamente.

## 8. Bloqueos reales

No se encontraron bloqueos reales de frontend para ejecutar el flujo completo.

Dependencias externas para prueba end-to-end:

- Backend completo levantado.
- `OPENAI_API_KEY` configurado para candidate/interview/evaluation/feedback segun aplique.
- Workers de media/evaluation/feedback corriendo.
- Permisos de camara/microfono en navegador.
- Navegador compatible con `MediaRecorder` y formato `video/webm`.

## 9. Recomendaciones antes de cerrar frontend

1. Detener tracks de camara/microfono si falla `startInterview`.
2. Activar advertencia de salida tambien en fases `finishing` y `finish-error`.
3. Mostrar error parcial si falla evaluation status o feedback status individualmente.
4. Ajustar copy de `/interviews/new` para reflejar que la sesion real ya existe.
5. Exponer desde backend topic/subtopic/questionType en endpoints de evaluation o feedback si se quiere detalle completo contextual.
6. Considerar un contenedor frontend de produccion separado del dev server para despliegue real.
7. Mantener `localStorage` solo para desarrollo o implementar mitigacion de seguridad en siguiente etapa.

## 10. Checklist final para prueba manual

### Preparacion

- [ ] Configurar `OPENAI_API_KEY` y variables necesarias en backend.
- [ ] Ejecutar `docker compose up`.
- [ ] Abrir `http://localhost:5173`.
- [ ] Confirmar que API Gateway responde en `http://localhost:8080/api/v1/health`.

### Auth

- [ ] Crear usuario en `/register`.
- [ ] Confirmar redireccion a `/dashboard`.
- [ ] Cerrar sesion.
- [ ] Iniciar sesion en `/login`.
- [ ] Recargar pagina y confirmar que la sesion persiste.

### CV y perfil

- [ ] Ir a `/cv`.
- [ ] Seleccionar PDF.
- [ ] Enviar upload.
- [ ] Confirmar que se muestra perfil generado.
- [ ] Ir a `/profile`.
- [ ] Confirmar nombre, resumen, seniority, targetRole, topics y subtopics.

### Creacion de entrevista

- [ ] Ir a `/interviews/new`.
- [ ] Verificar que el perfil se detecta.
- [ ] Configurar rol, nivel y cantidad de preguntas.
- [ ] Crear entrevista.
- [ ] Confirmar redireccion a `/interviews/:id/session`.

### Sesion

- [ ] Leer instrucciones.
- [ ] Iniciar entrevista.
- [ ] Aceptar camara y microfono.
- [ ] Confirmar preview de camara.
- [ ] Responder pregunta tecnica/soft con textarea.
- [ ] Si aparece `CODING`, confirmar Monaco Editor y escribir codigo.
- [ ] Avanzar preguntas.
- [ ] Confirmar indicador de grabacion.
- [ ] Finalizar entrevista.
- [ ] Confirmar upload de video y redireccion a processing.

### Procesamiento

- [ ] Confirmar timeline de etapas.
- [ ] Confirmar polling cada pocos segundos.
- [ ] Esperar evaluation `COMPLETED`.
- [ ] Esperar feedback `READY`.
- [ ] Abrir feedback desde el boton.

### Historial

- [ ] Ir a `/history`.
- [ ] Confirmar que aparece la entrevista.
- [ ] Validar fecha, rol, nivel, estados y score si existe.
- [ ] Abrir procesamiento o feedback desde acciones.

### Feedback

- [ ] Confirmar resumen ejecutivo.
- [ ] Confirmar score global y dimensiones disponibles.
- [ ] Seleccionar preguntas.
- [ ] Confirmar pregunta, respuesta y transcripcion si existe.
- [ ] Confirmar analisis semantico/audio/video/codigo segun respuesta backend.
- [ ] Confirmar recomendaciones.
- [ ] Confirmar video cargado via API Gateway.
- [ ] Reproducir segmento.
- [ ] Confirmar pausa automatica al final del segmento.
- [ ] Probar reiniciar segmento y ver video completo.

