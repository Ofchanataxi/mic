const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middlewares/authMiddleware');
const { allowAuthenticated } = require('../middlewares/roleMiddleware');
const { sendError } = require('../utils/responseUtils');
const meRoutes = require('./meRoutes');
const mediaGatewayController = require('../controllers/mediaGatewayController');
const authProxy = require('../proxy/authProxy');
const mediaProxy = require('../proxy/mediaProxy');
const candidateProxy = require('../proxy/candidateProxy');
const interviewProxy = require('../proxy/interviewProxy');
const evaluationProxy = require('../proxy/evaluationProxy');
const feedbackProxy = require('../proxy/feedbackProxy');

const router = express.Router();

const publicAuthPaths = [
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
];

const isPublicAuthPath = (req) => {
  const path = req.originalUrl.split('?')[0];
  return publicAuthPaths.includes(path);
};

const authGate = (req, res, next) => {
  if (isPublicAuthPath(req)) return optionalAuthenticate(req, res, next);
  return authenticate(req, res, next);
};

const blockFrontendRoute = (req, res) => sendError(
  res,
  404,
  'Route is not part of the public frontend gateway contract',
  'ROUTE_NOT_EXPOSED',
  req.requestId
);

router.use('/api/v1/auth', authGate);
router.use(authProxy);

router.use('/api/v1/me', authenticate, allowAuthenticated);
router.use(meRoutes);

router.post('/api/v1/candidates/:userId/performance', authenticate, blockFrontendRoute);
router.get('/api/v1/interviews/:id/evaluation-payload', authenticate, blockFrontendRoute);
router.get('/api/v1/interviews/:id/evaluation-data', authenticate, blockFrontendRoute);
router.post('/api/v1/evaluations/process', authenticate, blockFrontendRoute);
router.post('/api/v1/feedback/evaluation-ready', authenticate, blockFrontendRoute);
router.post('/api/v1/feedback/generate', authenticate, blockFrontendRoute);

router.get('/api/v1/media/:id/access', authenticate, allowAuthenticated, mediaGatewayController.getMediaAccess);

router.use('/api/v1/media', authenticate, allowAuthenticated);
router.use(mediaProxy);

router.use('/api/v1/candidates', authenticate, allowAuthenticated);
router.use(candidateProxy);

router.use('/api/v1/interviews', authenticate, allowAuthenticated);
router.use(interviewProxy);

router.use('/api/v1/evaluations', authenticate, allowAuthenticated);
router.use(evaluationProxy);

router.use('/api/v1/feedback', authenticate, allowAuthenticated);
router.use(feedbackProxy);

module.exports = router;
