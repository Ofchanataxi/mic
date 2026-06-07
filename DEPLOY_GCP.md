# Despliegue en GCP

Esta guia despliega MIC en Google Cloud usando:

- Cloud Run para servicios HTTP.
- Cloud Run Worker Pools para workers de colas.
- Cloud SQL PostgreSQL para Prisma.
- Memorystore Redis para BullMQ.
- Cloud Storage para archivos.
- Artifact Registry para imagenes Docker.
- Secret Manager para secretos.

## 1. Instalar herramientas en tu PC

Instala:

- Google Cloud CLI: https://cloud.google.com/sdk/docs/install
- Docker Desktop: https://www.docker.com/products/docker-desktop/
- Git, si no lo tienes: https://git-scm.com/downloads

Luego inicia sesion:

```powershell
gcloud auth login
gcloud auth application-default login
```

Selecciona o crea tu proyecto:

```powershell
gcloud config set project TU_PROJECT_ID
```

Define variables para reutilizar comandos:

```powershell
$PROJECT="TU_PROJECT_ID"
$REGION="us-central1"
$REPO="mic-containers"
$IMAGE_BASE="$REGION-docker.pkg.dev/$PROJECT/$REPO"
```

## 2. Habilitar APIs

```powershell
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com sqladmin.googleapis.com redis.googleapis.com storage.googleapis.com secretmanager.googleapis.com vpcaccess.googleapis.com compute.googleapis.com
```

## 3. Crear Artifact Registry

```powershell
gcloud artifacts repositories create $REPO `
  --repository-format=docker `
  --location=$REGION `
  --description="MIC container images"
```

## 4. Crear base de datos Cloud SQL

Crea la instancia:

```powershell
gcloud sql instances create mic-postgres `
  --database-version=POSTGRES_16 `
  --region=$REGION `
  --tier=db-f1-micro `
  --storage-size=10GB `
  --availability-type=zonal
```

Crea la base:

```powershell
gcloud sql databases create media_service --instance=mic-postgres
```

Crea usuario:

```powershell
gcloud sql users create mic_user `
  --instance=mic-postgres `
  --password="CAMBIA_ESTA_PASSWORD"
```

Para produccion real, usa una password fuerte y guardala en Secret Manager.

## 5. Crear Redis Memorystore

```powershell
gcloud redis instances create mic-redis `
  --size=1 `
  --region=$REGION `
  --redis-version=redis_7_0
```

Obtiene la IP:

```powershell
gcloud redis instances describe mic-redis --region=$REGION --format="value(host)"
```

Tu `REDIS_URL` sera:

```text
redis://REDIS_IP:6379
```

## 6. Crear Serverless VPC Connector

Cloud Run necesita VPC para llegar a Redis y, si usas IP privada de Cloud SQL, tambien a Postgres.

```powershell
gcloud compute networks vpc-access connectors create mic-vpc-connector `
  --region=$REGION `
  --range=10.8.0.0/28
```

## 7. Crear bucket de Cloud Storage

```powershell
gcloud storage buckets create gs://$PROJECT-mic-media `
  --location=$REGION
```

## 8. Crear secretos

```powershell
gcloud secrets create JWT_SECRET --replication-policy=automatic
gcloud secrets versions add JWT_SECRET --data-file=-

gcloud secrets create INTERNAL_SERVICE_TOKEN --replication-policy=automatic
gcloud secrets versions add INTERNAL_SERVICE_TOKEN --data-file=-

gcloud secrets create OPENAI_API_KEY --replication-policy=automatic
gcloud secrets versions add OPENAI_API_KEY --data-file=-

gcloud secrets create JUDGE0_API_KEY --replication-policy=automatic
gcloud secrets versions add JUDGE0_API_KEY --data-file=-
```

Cuando `gcloud` espere input, pega el valor secreto y pulsa `Ctrl+Z` + Enter en PowerShell.

## 9. Construir y subir imagenes

```powershell
gcloud builds submit api-gateway --tag "$IMAGE_BASE/api-gateway:latest"
gcloud builds submit auth-service --tag "$IMAGE_BASE/auth-service:latest"
gcloud builds submit candidate-service --tag "$IMAGE_BASE/candidate-service:latest"
gcloud builds submit interview-service --tag "$IMAGE_BASE/interview-service:latest"
gcloud builds submit media-service --tag "$IMAGE_BASE/media-service:latest"
gcloud builds submit evaluation-service --tag "$IMAGE_BASE/evaluation-service:latest"
gcloud builds submit feedback-service --tag "$IMAGE_BASE/feedback-service:latest"
```

El frontend necesita conocer la URL publica del gateway. Primero despliega backend/gateway, luego construye frontend con:

```powershell
gcloud builds submit frontend `
  --tag "$IMAGE_BASE/frontend:latest" `
  --substitutions=_VITE_API_BASE_URL="https://URL_DEL_GATEWAY/api/v1"
```

Si Cloud Build no pasa el `ARG` automaticamente con ese comando, usa build local:

```powershell
docker build frontend `
  --build-arg VITE_API_BASE_URL="https://URL_DEL_GATEWAY/api/v1" `
  -t "$IMAGE_BASE/frontend:latest"

gcloud auth configure-docker "$REGION-docker.pkg.dev"
docker push "$IMAGE_BASE/frontend:latest"
```

## 10. URLs y variables base

Para cada schema Prisma:

```text
postgresql://mic_user:CAMBIA_ESTA_PASSWORD@CLOUD_SQL_HOST:5432/media_service?schema=auth
postgresql://mic_user:CAMBIA_ESTA_PASSWORD@CLOUD_SQL_HOST:5432/media_service?schema=candidate
postgresql://mic_user:CAMBIA_ESTA_PASSWORD@CLOUD_SQL_HOST:5432/media_service?schema=interview
postgresql://mic_user:CAMBIA_ESTA_PASSWORD@CLOUD_SQL_HOST:5432/media_service?schema=evaluation
postgresql://mic_user:CAMBIA_ESTA_PASSWORD@CLOUD_SQL_HOST:5432/media_service?schema=feedback
postgresql://mic_user:CAMBIA_ESTA_PASSWORD@CLOUD_SQL_HOST:5432/media_service?schema=public
```

## 11. Desplegar servicios HTTP

Despliega primero servicios internos. Ejemplo `auth-service`:

```powershell
gcloud run deploy auth-service `
  --image "$IMAGE_BASE/auth-service:latest" `
  --region $REGION `
  --ingress internal `
  --allow-unauthenticated `
  --vpc-connector mic-vpc-connector `
  --set-env-vars NODE_ENV=production,PORT=3005,DATABASE_URL="DATABASE_URL_AUTH",JWT_ISSUER=mic-auth-service,JWT_AUDIENCE=mic-platform,FRONTEND_URL="https://URL_FRONTEND" `
  --set-secrets JWT_SECRET=JWT_SECRET:latest
```

Repite para:

- `media-service`, puerto `3000`, schema `public`, `REDIS_URL`, `GCS_PROJECT_ID`, `GCS_BUCKET_NAME`.
- `candidate-service`, puerto `3001`, schema `candidate`, `MEDIA_SERVICE_URL`.
- `interview-service`, puerto `3002`, schema `interview`, `CANDIDATE_SERVICE_URL`, `EVALUATION_SERVICE_URL`.
- `evaluation-service`, puerto `3003`, schema `evaluation`, `REDIS_URL`, URLs internas, OpenAI/Judge0.
- `feedback-service`, puerto `3004`, schema `feedback`, `REDIS_URL`, URLs internas.

Despues despliega `api-gateway` publico:

```powershell
gcloud run deploy api-gateway `
  --image "$IMAGE_BASE/api-gateway:latest" `
  --region $REGION `
  --allow-unauthenticated `
  --vpc-connector mic-vpc-connector `
  --set-env-vars NODE_ENV=production,PORT=8080,AUTH_SERVICE_URL="URL_AUTH",MEDIA_SERVICE_URL="URL_MEDIA",CANDIDATE_SERVICE_URL="URL_CANDIDATE",INTERVIEW_SERVICE_URL="URL_INTERVIEW",EVALUATION_SERVICE_URL="URL_EVALUATION",FEEDBACK_SERVICE_URL="URL_FEEDBACK",CORS_ORIGIN="https://URL_FRONTEND" `
  --set-secrets JWT_SECRET=JWT_SECRET:latest,INTERNAL_SERVICE_TOKEN=INTERNAL_SERVICE_TOKEN:latest
```

## 12. Ejecutar migraciones Prisma

Crea un job por servicio. Ejemplo:

```powershell
gcloud run jobs create migrate-auth `
  --image "$IMAGE_BASE/auth-service:latest" `
  --region $REGION `
  --vpc-connector mic-vpc-connector `
  --command npx `
  --args prisma,migrate,deploy `
  --set-env-vars DATABASE_URL="DATABASE_URL_AUTH"

gcloud run jobs execute migrate-auth --region $REGION --wait
```

Repite para `candidate`, `interview`, `evaluation`, `feedback` y `media-service`.

## 13. Desplegar workers

Cloud Run Worker Pools son adecuados para workers continuos no HTTP.

```powershell
gcloud beta run worker-pools deploy evaluation-worker `
  --image "$IMAGE_BASE/evaluation-service:latest" `
  --region $REGION `
  --vpc-connector mic-vpc-connector `
  --command npm `
  --args run,worker `
  --set-env-vars NODE_ENV=production,DATABASE_URL="DATABASE_URL_EVALUATION",REDIS_URL="redis://REDIS_IP:6379"
```

Repite con:

- `feedback-worker`, imagen `feedback-service`, args `run,worker`.
- `media-worker`, imagen `media-service`, args `run,worker`.

## 14. Desplegar frontend

Cuando ya tengas la URL del gateway, construye y despliega frontend:

```powershell
docker build frontend `
  --build-arg VITE_API_BASE_URL="https://URL_GATEWAY/api/v1" `
  -t "$IMAGE_BASE/frontend:latest"

docker push "$IMAGE_BASE/frontend:latest"

gcloud run deploy frontend `
  --image "$IMAGE_BASE/frontend:latest" `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080
```

## 15. Verificacion

Revisa URLs:

```powershell
gcloud run services list --region $REGION
```

Prueba health checks:

```powershell
curl https://URL_GATEWAY/health
curl https://URL_GATEWAY/api/v1/health
```

Mira logs:

```powershell
gcloud run services logs read api-gateway --region $REGION
gcloud run services logs read auth-service --region $REGION
```

