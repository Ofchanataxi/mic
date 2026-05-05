const prisma = require('../config/prisma');

const findByInterviewId = (interviewId) => prisma.interviewEvaluation.findUnique({
  where: { interviewId },
  include: {
    questionEvaluations: {
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        audioAnalysisResult: true,
        videoAnalysisResult: true,
        semanticEvaluationResult: true,
        codeEvaluationResult: true,
      },
    },
  },
});

const upsertProcessing = ({ evaluationJobId, interviewId, userId }) => prisma.interviewEvaluation.upsert({
  where: { interviewId },
  create: {
    evaluationJobId,
    interviewId,
    userId,
    status: 'PROCESSING',
  },
  update: {
    evaluationJobId,
    userId,
    status: 'PROCESSING',
  },
});

const updateFinal = (id, data) => prisma.interviewEvaluation.update({
  where: { id },
  data,
});

module.exports = {
  findByInterviewId,
  upsertProcessing,
  updateFinal,
};
