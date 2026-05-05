const prisma = require('../config/prisma');

const findByInterviewId = (interviewId) => prisma.evaluationJob.findUnique({
  where: { interviewId },
  include: { interviewEvaluation: true },
});

const create = ({ interviewId, userId }) => prisma.evaluationJob.create({
  data: { interviewId, userId },
});

const upsertPending = ({ interviewId, userId }) => prisma.evaluationJob.upsert({
  where: { interviewId },
  create: { interviewId, userId },
  update: { userId },
});

const markProcessing = (id) => prisma.evaluationJob.update({
  where: { id },
  data: {
    status: 'PROCESSING',
    startedAt: new Date(),
    finishedAt: null,
    errorMessage: null,
    attempts: { increment: 1 },
  },
});

const markCompleted = (id) => prisma.evaluationJob.update({
  where: { id },
  data: {
    status: 'COMPLETED',
    finishedAt: new Date(),
    errorMessage: null,
  },
});

const markFailed = (id, errorMessage) => prisma.evaluationJob.update({
  where: { id },
  data: {
    status: 'FAILED',
    finishedAt: new Date(),
    errorMessage: String(errorMessage).slice(0, 5000),
  },
});

const markPendingForRetry = (id) => prisma.evaluationJob.update({
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
  upsertPending,
  markProcessing,
  markCompleted,
  markFailed,
  markPendingForRetry,
};
