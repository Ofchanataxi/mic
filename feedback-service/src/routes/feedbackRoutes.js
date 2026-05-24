const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const internalAuthMiddleware = require('../middlewares/internalAuthMiddleware');

const router = express.Router();

router.get('/health', feedbackController.health);

router.use(internalAuthMiddleware);

router.post('/feedback/evaluation-ready', feedbackController.requestGeneration);
router.post('/feedback/generate', feedbackController.requestGeneration);
router.get('/feedback/jobs/:interviewId/status', feedbackController.getJobStatus);
router.get('/feedback/interviews/:interviewId', feedbackController.getInterviewReport);
router.get('/feedback/users/:userId/reports', feedbackController.listUserReports);
router.get('/feedback/reports/:reportId', feedbackController.getReportById);
router.post('/feedback/interviews/:interviewId/retry', feedbackController.retryInterview);

module.exports = router;
