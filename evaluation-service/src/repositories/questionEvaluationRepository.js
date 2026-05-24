const prisma = require('../config/prisma');

const upsertPending = ({ interviewEvaluationId, interviewId, question }) => prisma.questionEvaluation.upsert({
  where: {
    interviewId_questionId: {
      interviewId,
      questionId: question.questionId,
    },
  },
  create: {
    interviewEvaluationId,
    interviewId,
    questionId: question.questionId,
    order: question.order,
    candidateTopicId: question.candidateTopicId || null,
    candidateSubtopicId: question.candidateSubtopicId || null,
    skillType: question.skillType,
    status: 'PENDING',
    questionText: question.questionText,
    answerText: question.answerText || null,
    codeSubmission: question.codeSubmission || undefined,
    startTimeMs: question.startTimeMs,
    endTimeMs: question.endTimeMs,
    durationMs: Number.isFinite(question.endTimeMs) && Number.isFinite(question.startTimeMs)
      ? question.endTimeMs - question.startTimeMs
      : null,
  },
  update: {
    interviewEvaluationId,
    order: question.order,
    candidateTopicId: question.candidateTopicId || null,
    candidateSubtopicId: question.candidateSubtopicId || null,
    skillType: question.skillType,
    status: 'PENDING',
    questionText: question.questionText,
    answerText: question.answerText || null,
    codeSubmission: question.codeSubmission || undefined,
    startTimeMs: question.startTimeMs,
    endTimeMs: question.endTimeMs,
    durationMs: Number.isFinite(question.endTimeMs) && Number.isFinite(question.startTimeMs)
      ? question.endTimeMs - question.startTimeMs
      : null,
    errorMessage: null,
  },
});

const markProcessing = (id) => prisma.questionEvaluation.update({
  where: { id },
  data: { status: 'PROCESSING', errorMessage: null },
});

const markCompleted = (id, data) => prisma.questionEvaluation.update({
  where: { id },
  data: {
    ...data,
    status: 'COMPLETED',
    errorMessage: null,
  },
});

const markFailed = (id, errorMessage) => prisma.questionEvaluation.update({
  where: { id },
  data: {
    status: 'FAILED',
    errorMessage: String(errorMessage).slice(0, 5000),
  },
});

const markSkipped = (id, errorMessage) => prisma.questionEvaluation.update({
  where: { id },
  data: {
    status: 'SKIPPED',
    errorMessage: String(errorMessage).slice(0, 5000),
  },
});

const createAudioResult = (questionEvaluationId, data) => prisma.audioAnalysisResult.upsert({
  where: { questionEvaluationId },
  create: { questionEvaluationId, ...data },
  update: data,
});

const createVideoResult = (questionEvaluationId, data) => prisma.videoAnalysisResult.upsert({
  where: { questionEvaluationId },
  create: { questionEvaluationId, ...data },
  update: data,
});

const createSemanticResult = (questionEvaluationId, data) => prisma.semanticEvaluationResult.upsert({
  where: { questionEvaluationId },
  create: { questionEvaluationId, ...data },
  update: data,
});

const createCodeResult = (questionEvaluationId, data) => prisma.codeEvaluationResult.upsert({
  where: { questionEvaluationId },
  create: { questionEvaluationId, ...data },
  update: data,
});

const listByInterviewEvaluationId = (interviewEvaluationId) => prisma.questionEvaluation.findMany({
  where: { interviewEvaluationId },
  orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  include: {
    audioAnalysisResult: true,
    videoAnalysisResult: true,
    semanticEvaluationResult: true,
    codeEvaluationResult: true,
  },
});

module.exports = {
  upsertPending,
  markProcessing,
  markCompleted,
  markFailed,
  markSkipped,
  createAudioResult,
  createVideoResult,
  createSemanticResult,
  createCodeResult,
  listByInterviewEvaluationId,
};
