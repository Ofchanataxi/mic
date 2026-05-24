require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const { notFoundMiddleware, errorMiddleware } = require('./middlewares/errorMiddleware');
const logger = require('./utils/logger');
const prisma = require('./config/prisma');

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'x-request-id'],
  credentials: true,
};

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(authRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

const server = app.listen(env.port, () => {
  logger.info('auth-service listening', { port: env.port, nodeEnv: env.nodeEnv });
});

const shutdown = async () => {
  logger.info('Shutting down auth-service');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
