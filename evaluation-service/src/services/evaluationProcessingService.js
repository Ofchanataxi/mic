const path = require('path');
const fs = require('fs/promises');
const env = require('../config/env');
const logger = require('../utils/logger');
const { getInterviewTempPaths, downloadFile, removeDir, safeName } = require('../utils/fileUtils');
const interviewClient = require('../clients/interviewClient');
const mediaClient = require('../clients/mediaClient');
const candidateClient = require('../clients/candidateClient');
const feedbackClient = require('../clients/feedbackClient');
const ffmpegProvider = require('../providers/ffmpegProvider');
const transcriptionService = require('./transcriptionService');
const semanticEvaluationService = require('./semanticEvaluationService');
const audioAnalysisService = require('./audioAnalysisService');
const videoAnalysisService = require('./videoAnalysisService');
const codeEvaluationService = require('./codeEvaluationService');
const scoreOrchestrator = require('./scoreOrchestrator');
const evaluationJobRepository = require('../repositories/evaluationJobRepository');
const interviewEvaluationRepository = require('../repositories/interviewEvaluationRepository');
const questionEvaluationRepository = require('../repositories/questionEvaluationRepository');

const validateInterviewData = (data, expectedInterviewId) => {
  if (!data?.interviewId) throw new Error('interview-service response is missing interviewId');
  if (data.interviewId !== expectedInterviewId) throw new Error('interview-service returned a different interviewId');
  if (!data.userId) throw new Error('interview-service response is missing userId');
  if (data.status !== 'FINISHED') throw new Error(`Interview must be FINISHED before evaluation. Current status: ${data.status}`);
  if (!Array.isArray(data.questions)) throw new Error('interview-service response questions must be an array');
  if (!data.mediaId && !data.videoAccessUrl) throw new Error('Interview has no mediaId or videoAccessUrl for evaluation');
};

const validateQuestion = (question) => {
  if (!question.questionId) throw new Error('Question is missing questionId');
  if (!question.questionText) throw new Error(`Question ${question.questionId} is missing questionText`);
  if (!['TECHNICAL', 'SOFT', 'CODE'].includes(question.skillType)) throw new Error(`Question ${question.questionId} has invalid skillType`);
  if (!Number.isFinite(question.startTimeMs) || !Number.isFinite(question.endTimeMs)) throw new Error(`Question ${question.questionId} has missing timestamps`);
  if (question.endTimeMs <= question.startTimeMs) throw new Error(`Question ${question.questionId} has invalid timestamp range`);
};

const resolveVideoAccessUrl = async (interviewData) => {
  if (interviewData.mediaId) {
    const access = await mediaClient.getMediaAccess(interviewData.mediaId);
    if (!access?.accessUrl) throw new Error('media-service access response is missing accessUrl');
    return access.accessUrl;
  }
  return interviewData.videoAccessUrl;
};

const processQuestion = async ({ interviewEvaluation, interviewId, question, paths }) => {
  const questionEvaluation = await questionEvaluationRepository.upsertPending({
    interviewEvaluationId: interviewEvaluation.id,
    interviewId,
    question,
  });

  try {
    validateQuestion(question);
    await questionEvaluationRepository.markProcessing(questionEvaluation.id);

    const segmentName = `question-${question.order || safeName(question.questionId)}.mp3`;
    const audioPath = path.join(paths.segments, segmentName);
    await ffmpegProvider.extractAudioSegment({
      videoPath: paths.sourceVideo,
      outputPath: audioPath,
      startTimeMs: question.startTimeMs,
      endTimeMs: question.endTimeMs,
    });

    const transcription = await transcriptionService.transcribeSegment(audioPath);
    const durationMs = question.endTimeMs - question.startTimeMs;
    const semantic = await semanticEvaluationService.evaluateAnswer({
      questionText: question.questionText,
      skillType: question.skillType,
      answerText: question.answerText,
      transcription,
      codeSubmission: question.codeSubmission,
    });
    const audio = audioAnalysisService.analyzeAudio({ transcription, durationMs });
    const video = await videoAnalysisService.analyzeVideo({
      videoSegmentPath: null,
      startTimeMs: question.startTimeMs,
      endTimeMs: question.endTimeMs,
    });
    const code = await codeEvaluationService.evaluateCode({
      skillType: question.skillType,
      codeSubmission: question.codeSubmission,
    });

    const semanticScore = semantic.overallSemanticScore;
    const audioScore = audio.fluencyScore;
    const videoScore = video.attentionScore;
    const codeScore = code?.codeScore ?? null;
    const finalScore = scoreOrchestrator.calculateQuestionScore({
      skillType: question.skillType,
      semanticScore,
      audioScore,
      videoScore,
      codeScore,
    });

    await Promise.all([
      questionEvaluationRepository.createSemanticResult(questionEvaluation.id, {
        coherenceScore: semantic.coherenceScore,
        technicalAccuracyScore: semantic.technicalAccuracyScore,
        clarityScore: semantic.clarityScore,
        depthScore: semantic.depthScore,
        relevanceScore: semantic.relevanceScore,
        overallSemanticScore: semantic.overallSemanticScore,
        justification: semantic.justification,
        rawData: semantic,
      }),
      questionEvaluationRepository.createAudioResult(questionEvaluation.id, audio),
      questionEvaluationRepository.createVideoResult(questionEvaluation.id, video),
      code ? questionEvaluationRepository.createCodeResult(questionEvaluation.id, {
        passedTests: code.passedTests,
        totalTests: code.totalTests,
        executionScore: code.codeScore,
        compilationStatus: code.compilationStatus,
        runtimeError: code.runtimeError,
        simulated: code.simulated,
        rawData: code.rawData,
      }) : Promise.resolve(),
    ]);

    const completed = await questionEvaluationRepository.markCompleted(questionEvaluation.id, {
      answerText: question.answerText || null,
      transcription,
      semanticScore,
      audioScore,
      videoScore,
      codeScore,
      finalScore,
      strengths: semantic.strengths,
      weaknesses: semantic.weaknesses,
      recommendations: semantic.recommendations,
      rawSemanticEvaluation: semantic,
      rawAudioAnalysis: audio,
      rawVideoAnalysis: video,
      rawCodeEvaluation: code,
    });

    logger.info('Question evaluation completed', { interviewId, questionId: question.questionId, finalScore });
    return completed;
  } catch (error) {
    const isTimestampError = /timestamp|missing timestamps|invalid timestamp/i.test(error.message);
    const failed = isTimestampError
      ? await questionEvaluationRepository.markSkipped(questionEvaluation.id, error.message)
      : await questionEvaluationRepository.markFailed(questionEvaluation.id, error.message);
    logger.warn('Question evaluation failed', { interviewId, questionId: question.questionId, error: error.message });
    return failed;
  }
};

const sendCandidatePerformance = async ({ interviewId, userId, questions, globalScores }) => {
  const results = questions
    .filter((question) => question.status === 'COMPLETED' && question.candidateSubtopicId && question.finalScore !== null)
    .map((question) => ({
      candidateSubtopicId: question.candidateSubtopicId,
      questionId: question.questionId,
      score: question.finalScore,
      evaluationType: 'FINAL_QUESTION_SCORE',
      feedback: question.rawSemanticEvaluation?.justification || question.errorMessage || '',
    }));

  questions
    .filter((question) => question.status === 'COMPLETED' && !question.candidateSubtopicId)
    .forEach((question) => logger.warn('Question has no candidateSubtopicId; adaptive performance not sent', {
      interviewId,
      questionId: question.questionId,
    }));

  if (!results.length) {
    logger.warn('No candidate-service performance results to send', { interviewId });
    return;
  }

  await candidateClient.sendPerformance({
    userId,
    interviewId,
    results,
    overall: {
      score: globalScores.overallScore,
      technicalScore: globalScores.technicalScore,
      softSkillsScore: globalScores.softSkillsScore,
      codeScore: globalScores.codeScore,
      semanticScore: globalScores.semanticScore,
      audioScore: globalScores.audioScore,
      videoScore: globalScores.videoScore,
    },
  });
  logger.info('candidate-service updated with evaluation performance', { interviewId, count: results.length });
};

const processEvaluation = async ({ evaluationJobId, interviewId, userId }) => {
  let tempRoot;
  const job = await evaluationJobRepository.markProcessing(evaluationJobId);
  logger.info('Evaluation job started', { evaluationJobId, interviewId });

  try {
    await ffmpegProvider.ensureFfmpegAvailable();
    const interviewData = await interviewClient.getEvaluationData(interviewId);
    validateInterviewData(interviewData, interviewId);
    logger.info('Interview evaluation data fetched', { interviewId, questions: interviewData.questions.length });

    const paths = await getInterviewTempPaths(env.tempProcessingDir, interviewId);
    tempRoot = paths.root;
    const accessUrl = await resolveVideoAccessUrl(interviewData);
    await downloadFile(accessUrl, paths.sourceVideo);
    await fs.access(paths.sourceVideo);
    logger.info('Interview video downloaded', { interviewId, sourceVideo: paths.sourceVideo });

    const interviewEvaluation = await interviewEvaluationRepository.upsertProcessing({
      evaluationJobId,
      interviewId,
      userId: interviewData.userId || userId,
    });

    for (const question of interviewData.questions) {
      await processQuestion({
        interviewEvaluation,
        interviewId,
        question,
        paths,
      });
    }

    const questions = await questionEvaluationRepository.listByInterviewEvaluationId(interviewEvaluation.id);
    const globalScores = scoreOrchestrator.calculateGlobalScores(questions);
    const summary = scoreOrchestrator.buildSummary(questions, globalScores);
    const finalStatus = globalScores.evaluatedQuestions === 0
      ? 'FAILED'
      : globalScores.failedQuestions > 0
        ? 'PARTIAL'
        : 'COMPLETED';

    const updatedEvaluation = await interviewEvaluationRepository.updateFinal(interviewEvaluation.id, {
      status: finalStatus,
      ...globalScores,
      summary,
      rawData: {
        interviewData: {
          interviewId: interviewData.interviewId,
          status: interviewData.status,
          mediaId: interviewData.mediaId || null,
          hasVideoAccessUrl: Boolean(interviewData.videoAccessUrl),
        },
      },
    });
    logger.info('Global interview evaluation calculated', { interviewId, ...globalScores });

    try {
      await sendCandidatePerformance({
        interviewId,
        userId: interviewData.userId || userId,
        questions,
        globalScores,
      });
    } catch (error) {
      logger.error('candidate-service performance update failed', { interviewId, error: error.message });
    }

    try {
      await feedbackClient.notifyEvaluationReady({
        interviewId,
        userId: interviewData.userId || userId,
        evaluationId: updatedEvaluation.id,
        overallScore: updatedEvaluation.overallScore,
      });
      logger.info('feedback-service notified', { interviewId });
    } catch (error) {
      logger.warn('feedback-service notification failed', { interviewId, error: error.message });
    }

    await evaluationJobRepository.markCompleted(job.id);
    logger.info('Evaluation job completed', { evaluationJobId, interviewId });
    return updatedEvaluation;
  } catch (error) {
    await evaluationJobRepository.markFailed(job.id, error.message);
    logger.error('Evaluation job failed', { evaluationJobId, interviewId, error: error.message, stack: error.stack });
    throw error;
  } finally {
    if (tempRoot) {
      await removeDir(tempRoot);
      logger.info('Temporary evaluation files cleaned', { interviewId, tempRoot });
    }
  }
};

module.exports = {
  processEvaluation,
};
