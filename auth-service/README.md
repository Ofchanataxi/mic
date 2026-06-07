# auth-service

`auth-service` es dueño de usuarios, credenciales, roles y refresh tokens de CCInterview. Emite JWT compatibles con `api-gateway` y persiste datos en PostgreSQL usando el schema `auth`.

## Qué Hace

- Registro de usuarios `CANDIDATE`.
- Verificación de correo antes del primer inicio de sesión.
- Recuperación y restablecimiento seguro de contraseña.
- Login con bcrypt.
- Emisión de access tokens JWT.
- Emisión y rotación de refresh tokens.
- Logout revocando refresh tokens.
- Endpoint `me`.
- Administración básica de usuarios para rol `ADMIN`.
- Seed seguro del primer administrador.

## Qué NO Hace

- No maneja perfiles de candidato.
- No crea entrevistas.
- No evalúa ni genera feedback.
- No escribe en schemas de otros servicios.
- No expone datos sensibles ni `passwordHash`.

## Tecnologías

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT
- bcryptjs
- Docker

## Variables de Entorno

Copia `.env.example` a `.env` para local:

```bash
cp .env.example .env
```

Variables principales:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/media_service?schema=auth`
- `JWT_SECRET=dev-secret`
- `JWT_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `JWT_ISSUER=mic-auth-service`
- `JWT_AUDIENCE=mic-platform`
- `BCRYPT_SALT_ROUNDS=10`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CORS_ORIGIN`
- `EMAIL_FROM`
- `EMAIL_PASSWORD`
- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=465`
- `EMAIL_SECURE=true`
- `FRONTEND_URL=http://localhost:5173`
- `EMAIL_VERIFICATION_EXPIRES_IN=24h`
- `PASSWORD_RESET_EXPIRES_IN=1h`

`EMAIL_PASSWORD` debe ser una contraseña de aplicación del proveedor SMTP y nunca debe guardarse en Git. En producción, `JWT_SECRET`, `ADMIN_PASSWORD` y las credenciales SMTP deben venir de Secret Manager o variables seguras del entorno.

## Modelo de Datos

- `User`: email único, hash de contraseña, rol, estado y fecha de último login.
- `RefreshToken`: token hasheado, expiración, revocación y rotación.
- `ActionToken`: token de un solo uso, hasheado y con expiración para verificar correo o restablecer contraseña.

El servicio usa exclusivamente el schema `auth`.

## Ejecutar Localmente

```bash
cd auth-service
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Docker Compose Raíz

Desde la raíz:

```bash
docker compose up --build auth-service
```

El compose usa:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/media_service?schema=auth
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

## Crear Primer ADMIN

Configura:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123456
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=CCInterview
```

Ejecuta:

```bash
npm run seed:admin
```

El script no imprime la contraseña y no crea otro admin si ya existe uno.

En Docker:

```bash
docker compose run --rm auth-service npm run seed:admin
```

## Postman

Register:

```http
POST http://localhost:3005/auth/register
Content-Type: application/json

{
  "email": "candidate@example.com",
  "password": "Candidate123",
  "firstName": "Pedro",
  "lastName": "Piedra"
}
```

El registro envía un enlace de verificación. La cuenta no puede iniciar sesión hasta confirmar el correo.

Verificar correo:

```http
POST http://localhost:3005/auth/verify-email
Content-Type: application/json

{
  "token": "<token-del-enlace>"
}
```

Reenviar verificación:

```http
POST http://localhost:3005/auth/resend-verification
Content-Type: application/json

{
  "email": "candidate@example.com"
}
```

Solicitar recuperación:

```http
POST http://localhost:3005/auth/forgot-password
Content-Type: application/json

{
  "email": "candidate@example.com"
}
```

Restablecer contraseña:

```http
POST http://localhost:3005/auth/reset-password
Content-Type: application/json

{
  "token": "<token-del-enlace>",
  "password": "NuevaPassword123"
}
```

Login:

```http
POST http://localhost:3005/auth/login
Content-Type: application/json

{
  "email": "candidate@example.com",
  "password": "Candidate123"
}
```

Refresh:

```http
POST http://localhost:3005/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refreshToken>"
}
```

Me:

```http
GET http://localhost:3005/auth/me
Authorization: Bearer <accessToken>
```

Logout:

```http
POST http://localhost:3005/auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "<refreshToken>"
}
```

Crear usuario admin:

```http
POST http://localhost:3005/auth/admin/users
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "email": "admin2@example.com",
  "password": "Admin123456",
  "firstName": "Admin",
  "lastName": "Two",
  "role": "ADMIN"
}
```

## Vía API Gateway

Si `api-gateway` está disponible:

```http
POST http://localhost:8080/api/v1/auth/register
POST http://localhost:8080/api/v1/auth/login
POST http://localhost:8080/api/v1/auth/refresh
GET  http://localhost:8080/api/v1/auth/me
```

## Integración con API Gateway

El JWT incluye:

```json
{
  "sub": "userId",
  "userId": "userId",
  "email": "user@example.com",
  "role": "CANDIDATE"
}
```

`api-gateway` debe usar el mismo `JWT_SECRET`, `JWT_ISSUER` y `JWT_AUDIENCE`.

## GCP

El servicio está listo para contenedor. En producción:

- PostgreSQL puede ser Cloud SQL.
- Secretos deben venir de Secret Manager o variables seguras.
- Auth-service puede quedar interno detrás de API Gateway.
- Usar HTTPS en el punto de entrada público.

## Errores Comunes

- `EMAIL_ALREADY_EXISTS`: el email ya está registrado.
- `INVALID_CREDENTIALS`: email o contraseña incorrectos.
- `USER_DISABLED`: usuario deshabilitado.
- `TOKEN_EXPIRED`: access o refresh token expirado.
- `INVALID_REFRESH_TOKEN`: refresh token inexistente, revocado o rotado.
- `JWT_SECRET is required`: falta configurar secreto JWT.
