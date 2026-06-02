require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const gatewayRoutes = require('./routes/gatewayRoutes');
const { markInternalService } = require('./middlewares/authMiddleware');
const { requestIdMiddleware, httpLogger } = require('./middlewares/requestLogger');
const { errorMiddleware } = require('./middlewares/errorMiddleware');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const logger = require('./utils/logger');

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Range', 'x-internal-service-token', 'x-request-id'],
  exposedHeaders: ['x-request-id', 'Accept-Ranges', 'Content-Length', 'Content-Range'],
  credentials: true,
};

const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => (
    req.path === '/health'
    || req.path === '/api/v1/health'
    || req.path === '/api/v1/health/services'
    || req.path.startsWith('/api/v1/auth/')
    || /^\/api\/v1\/media\/[^/]+\/file$/.test(req.path)
  ),
  handler: (req, res) => {
    res.status(429).json({
      error: {
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        requestId: req.requestId,
      },
    });
  },
});

app.disable('x-powered-by');
app.use(requestIdMiddleware);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(limiter);
app.use(httpLogger);
app.use(markInternalService);
app.use(healthRoutes);
app.use(gatewayRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

const server = app.listen(env.port, () => {
  logger.info('api-gateway listening', { port: env.port, nodeEnv: env.nodeEnv });
});

const shutdown = () => {
  logger.info('Shutting down api-gateway');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
