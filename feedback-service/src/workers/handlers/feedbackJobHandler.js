const feedbackProcessingService = require('../../services/feedbackProcessingService');

const handleFeedbackJob = async (job) => {
  const {
    feedbackJobId,
    interviewId,
    userId,
    evaluationId,
  } = job.data;

  return feedbackProcessingService.processFeedback({
    feedbackJobId,
    interviewId,
    userId,
    evaluationId,
  });
};

module.exports = {
  handleFeedbackJob,
};
