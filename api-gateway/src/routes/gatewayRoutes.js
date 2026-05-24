const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middlewares/authMiddleware');
const { allowAuthenticated } = require('../middlewares/roleMiddleware');
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

const isPublicAuthPath = (req) => publicAuthPaths.includes(req.path);

const authGate = (req, res, next) => {
  if (isPublicAuthPath(req)) return optionalAuthenticate(req, res, next);
  return authenticate(req, res, next);
};

router.use('/api/v1/auth', authGate, authProxy);

router.use('/api/v1/media', authenticate, allowAuthenticated, mediaProxy);
router.use('/api/v1/candidates', authenticate, allowAuthenticated, candidateProxy);
router.use('/api/v1/interviews', authenticate, allowAuthenticated, interviewProxy);
router.use('/api/v1/evaluations', authenticate, allowAuthenticated, evaluationProxy);
router.use('/api/v1/feedback', authenticate, allowAuthenticated, feedbackProxy);

module.exports = router;
