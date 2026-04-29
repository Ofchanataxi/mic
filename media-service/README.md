# media-service

`media-service` gestiona el upload, almacenamiento, procesamiento y acceso a recursos `VIDEO` y `PDF` para el sistema de entrevistas tecnicas multimodales.

## Que hace este servicio

- Recibe archivos por `multipart/form-data`.
- Valida tipo y tamano de archivo.
- Guarda metadata en PostgreSQL usando Prisma.
- Procesa videos de forma asincrona con BullMQ + Redis.
- Optimiza videos con FFmpeg a una sola salida MP4.
- Sube archivos finales al emulador de Google Cloud Storage.
- Expone endpoints REST para metadata, estado y acceso al recurso final.

## Tecnologias usadas

- Node.js 20
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- FFmpeg
- `@google-cloud/storage`
- `fsouza/fake-gcs-server`

## Requisitos previos

- Node.js 20+
- Docker y Docker Compose
- FFmpeg disponible en el host si corres el servicio fuera de Docker

Si ejecutas todo con el `docker-compose.yml` raiz, no necesitas instalar PostgreSQL, Redis ni el emulador GCS manualmente.

## Variables de entorno

1. Copia el ejemplo:

```bash
cp .env.example .env
```

2. Ajusta los valores si corres fuera de Docker:

- `DATABASE_URL`
- `REDIS_URL`
- `GCS_EMULATOR_HOST`
- `SERVICE_BASE_URL`

## Levantar dependencias con docker-compose raiz

Desde la raiz del monorepo:

```bash
docker compose up -d postgres redis gcs-emulator
```

Si quieres correr tambien la API y el worker dentro de Docker:

```bash
docker compose up --build media-service media-worker
```

## Ejecutar migraciones de Prisma

Desde [`media-service`](C:/Users/mrcolina/Documents/MIC/DESARROLLO/mic/media-service):

```bash
npm install
npm run prisma:generate
npx prisma migrate dev --name init_media_service
```

Si estas dentro de Docker:

```bash
docker compose run --rm media-service npm run prisma:deploy
```

## Correr media-service

### Opcion 1: local

Terminal 1:

```bash
cd media-service
npm install
npm run dev
```

Terminal 2:

```bash
cd media-service
npm run worker:dev
```

### Opcion 2: docker compose

```bash
docker compose up --build media-service media-worker
```

## Endpoints disponibles

- `POST /media/upload`
- `GET /media/:id`
- `GET /media/:id/status`
- `GET /media/:id/access`
- `GET /media/:id/file`
- `GET /health`

## Probar con Postman

Base URL local:

```text
http://localhost:3000
```

### 1. Upload de PDF

`POST /media/upload`

Tipo: `form-data`

- `file`: seleccionar PDF
- `resourceType`: `PDF`
- `interviewId`: `interview-123`
- `ownerId`: `candidate-456`

Respuesta esperada:

```json
{
  "mediaId": "uuid",
  "status": "READY",
  "message": "PDF uploaded successfully"
}
```

### 2. Upload de VIDEO

`POST /media/upload`

Tipo: `form-data`

- `file`: seleccionar video
- `resourceType`: `VIDEO`
- `interviewId`: `interview-123`
- `ownerId`: `candidate-456`

Respuesta esperada:

```json
{
  "mediaId": "uuid",
  "status": "UPLOADED",
  "message": "Video uploaded and queued for processing"
}
```

### 3. Consultar metadata

`GET /media/{mediaId}`

Ejemplo de respuesta:

```json
{
  "id": "uuid",
  "resourceType": "VIDEO",
  "interviewId": "interview-123",
  "ownerId": "candidate-456",
  "originalFilename": "session.webm",
  "mimeType": "video/webm",
  "storageKey": "videos/interview-123/uuid.mp4",
  "bucketName": "media-assets",
  "sizeBytes": "4210388",
  "status": "READY",
  "durationMs": 153000,
  "errorMessage": null,
  "createdAt": "2026-04-23T00:00:00.000Z",
  "updatedAt": "2026-04-23T00:02:00.000Z"
}
```

### 4. Consultar status

`GET /media/{mediaId}/status`

```json
{
  "mediaId": "uuid",
  "status": "PROCESSING",
  "errorMessage": null
}
```

### 5. Obtener acceso al recurso

`GET /media/{mediaId}/access`

```json
{
  "mediaId": "uuid",
  "status": "READY",
  "accessUrl": "http://localhost:3000/media/uuid/file",
  "resourceType": "VIDEO",
  "mimeType": "video/mp4"
}
```

Ese `accessUrl` puede ser usado directamente por el frontend para reproducir o descargar el recurso final.

## Flujo async resumido

1. El cliente sube el archivo a `POST /media/upload`.
2. Si es `PDF`, el servicio lo sube a GCS emulator y deja el registro en `READY`.
3. Si es `VIDEO`, el servicio guarda temporalmente el archivo, crea el registro en `UPLOADED` y encola un job en Redis.
4. El worker toma el job, cambia el estado a `PROCESSING`, ejecuta FFmpeg, sube el MP4 optimizado al bucket y elimina el archivo temporal original.
5. Si todo sale bien, deja el recurso en `READY`; si falla, deja el recurso en `FAILED`.

## Errores comunes y diagnostico

- `connect ECONNREFUSED` hacia PostgreSQL:
  Revisa que `postgres` este levantado y que `DATABASE_URL` apunte al host correcto.
- `ECONNREFUSED` hacia Redis:
  Verifica `REDIS_URL` y el contenedor `redis`.
- `ffmpeg not found`:
  Instala FFmpeg en el host o ejecuta el servicio con Docker.
- `Bucket does not exist`:
  El servicio intenta crearlo automaticamente al iniciar. Si falla, revisa `GCS_EMULATOR_HOST` y `GCS_BUCKET_NAME`.
- `File type not allowed`:
  Ajusta `ALLOWED_VIDEO_TYPES` o `ALLOWED_PDF_TYPES` segun el archivo real recibido.
- `PayloadTooLargeError` o error de Multer:
  Aumenta `MAX_FILE_SIZE_MB`.

## Notas de desarrollo

- El archivo original de video se elimina despues de procesarse.
- El archivo final de video es una sola salida MP4 optimizada.
- El endpoint `GET /media/:id/file` actua como proxy para evitar exponer directamente el SDK o depender de ACLs publicas del emulador.
