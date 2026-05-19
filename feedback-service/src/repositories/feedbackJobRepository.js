const prisma = require('../config/prisma');

const findByInterviewId = (interviewId) => prisma.feedbackJob.findUnique({
  where: { interviewId },
  include: { report: true },
});

const create = ({ interviewId, userId, evaluationId }) => prisma.feedbackJob.create({
  data: { interviewId, userId, evaluationId: evaluationId || null },
});

const updateMetadata = (id, { userId, evaluationId }) => prisma.feedbackJob.update({
  where: { id },
  data: {
    userId,
    evaluationId: evaluationId || null,
  },
});

const markProcessing = (id) => prisma.feedbackJob.update({
  where: { id },
  data: {
    status: 'PROCESSING',
    startedAt: new Date(),
    finishedAt: null,
    errorMessage: null,
    attempts: { increment: 1 },
  },
});

const markCompleted = (id) => prisma.feedbackJob.update({
  where: { id },
  data: {
    status: 'COMPLETED',
    finishedAt: new Date(),
    errorMessage: null,
  },
});

const markFailed = (id, errorMessage) => prisma.feedbackJob.update({
  where: { id },
  data: {
    status: 'FAILED',
    finishedAt: new Date(),
    errorMessage: String(errorMessage).slice(0, 5000),
  },
});

const markPendingForRetry = (id) => prisma.feedbackJob.update({
  where: { id },
  data: {
    status: 'PENDING',
    startedAt: null,
    finishedAt: null,
    errorMessage: null,
  },
});

module.exports = {
  findByInterviewId,
  create,
  updateMetadata,
  markProcessing,
  markCompleted,
  markFailed,
  markPendingForRetry,
};
