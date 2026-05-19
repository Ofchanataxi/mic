const prisma = require('../config/prisma');

const includeQuestionDetails = {
  questionDetails: {
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  },
};

const findByInterviewId = (interviewId) => prisma.feedbackReport.findUnique({
  where: { interviewId },
  include: includeQuestionDetails,
});

const findById = (id) => prisma.feedbackReport.findUnique({
  where: { id },
  include: includeQuestionDetails,
});

const listByUserId = (userId) => prisma.feedbackReport.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  select: {
    id: true,
    interviewId: true,
    status: true,
    overallScore: true,
    generalLevel: true,
    createdAt: true,
    updatedAt: true,
  },
});

const upsertGenerating = ({ feedbackJobId, interviewId, userId, evaluationId }) => prisma.feedbackReport.upsert({
  where: { interviewId },
  create: {
    feedbackJobId,
    interviewId,
    userId,
    evaluationId: evaluationId || null,
    status: 'GENERATING',
  },
  update: {
    feedbackJobId,
    userId,
    evaluationId: evaluationId || null,
    status: 'GENERATING',
  },
});

const markReady = (id, data) => prisma.feedbackReport.update({
  where: { id },
  data: {
    ...data,
    status: 'READY',
  },
  include: includeQuestionDetails,
});

const markFailedByInterviewId = (interviewId, errorMessage) => prisma.feedbackReport.updateMany({
  where: { interviewId },
  data: {
    status: 'FAILED',
    generatedReport: {
      errorMessage: String(errorMessage).slice(0, 5000),
    },
  },
});

const replaceQuestionDetails = async ({ feedbackReportId, interviewId, details }) => prisma.$transaction(async (tx) => {
  await tx.feedbackQuestionDetail.deleteMany({ where: { feedbackReportId } });
  if (!details.length) return [];
  return tx.feedbackQuestionDetail.createMany({
    data: details.map((detail) => ({
      feedbackReportId,
      interviewId,
      questionId: detail.questionId,
      order: detail.order,
      skillType: detail.skillType,
      questionText: detail.questionText,
      candidateSubtopicId: detail.candidateSubtopicId || null,
      topicName: detail.topicName || null,
      subtopicName: detail.subtopicName || null,
      score: detail.score,
      summary: detail.summary,
      strengths: detail.strengths || [],
      weaknesses: detail.weaknesses || [],
      recommendations: detail.recommendations || [],
      semanticNotes: detail.semanticNotes || null,
      audioNotes: detail.audioNotes || null,
      videoNotes: detail.videoNotes || null,
      codeNotes: detail.codeNotes || null,
    })),
  });
});

module.exports = {
  findByInterviewId,
  findById,
  listByUserId,
  upsertGenerating,
  markReady,
  markFailedByInterviewId,
  replaceQuestionDetails,
};
