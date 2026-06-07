require('dotenv').config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const splitCsv = (value, fallback = []) => {
  if (!value) return fallback;
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
};

const env = {
  port: toNumber(process.env.PORT, 3005),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  jwtIssuer: process.env.JWT_ISSUER || 'mic-auth-service',
  jwtAudience: process.env.JWT_AUDIENCE || 'mic-platform',
  bcryptSaltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 10),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminFirstName: process.env.ADMIN_FIRST_NAME || 'Admin',
  adminLastName: process.env.ADMIN_LAST_NAME || 'CCInterview',
  corsOrigins: splitCsv(process.env.CORS_ORIGIN, ['http://localhost:5173', 'http://localhost:8080']),
  logLevel: process.env.LOG_LEVEL || 'info',
  emailFrom: process.env.EMAIL_FROM || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: toNumber(process.env.EMAIL_PORT, 465),
  emailSecure: String(process.env.EMAIL_SECURE || 'true').toLowerCase() === 'true',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  emailVerificationExpiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '24h',
  passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
};

module.exports = env;
