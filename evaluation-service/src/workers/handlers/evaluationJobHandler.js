const evaluationProcessingService = require('../../services/evaluationProcessingService');

const handleEvaluationJob = async (job) => {
  const { evaluationJobId, interviewId, userId } = job.data;
  return evaluationProcessingService.processEvaluation({ evaluationJobId, interviewId, userId });
};

module.exports = {
  handleEvaluationJob,
};
