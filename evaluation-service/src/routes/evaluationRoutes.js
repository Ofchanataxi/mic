const express = require('express');
const evaluationController = require('../controllers/evaluationController');
const internalAuthMiddleware = require('../middlewares/internalAuthMiddleware');

const router = express.Router();

router.get('/health', evaluationController.health);

router.use(internalAuthMiddleware);

router.post('/evaluations/process', evaluationController.processInterview);
router.get('/evaluations/jobs/:interviewId/status', evaluationController.getJobStatus);
router.get('/evaluations/interviews/:interviewId', evaluationController.getInterviewEvaluation);
router.get('/evaluations/interviews/:interviewId/questions', evaluationController.getInterviewQuestions);
router.post('/evaluations/interviews/:interviewId/retry', evaluationController.retryInterview);

module.exports = router;
