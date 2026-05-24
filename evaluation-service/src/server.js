require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const evaluationRoutes = require('./routes/evaluationRoutes');
const { notFoundMiddleware, errorMiddleware } = require('./middlewares/errorMiddleware');
const logger = require('./utils/logger');
const prisma = require('./config/prisma');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(evaluationRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

const server = app.listen(env.port, () => {
  logger.info('evaluation-service listening', { port: env.port, nodeEnv: env.nodeEnv });
});

const shutdown = async () => {
  logger.info('Shutting down evaluation-service');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
