const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const asArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const asScore = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

const normalizeQuestion = ({ feedbackQuestion = {}, evaluationQuestion = {} }) => {
  const semanticEvaluation = firstDefined(
    evaluationQuestion.semanticEvaluation,
    evaluationQuestion.semanticEvaluationResult,
    feedbackQuestion.semanticEvaluation,
    feedbackQuestion.semanticNotes,
    null,
  );
  const audioAnalysis = firstDefined(
    evaluationQuestion.audioAnalysis,
    evaluationQuestion.audioAnalysisResult,
    feedbackQuestion.audioAnalysis,
    feedbackQuestion.audioNotes,
    null,
  );
  const videoAnalysis = firstDefined(
    evaluationQuestion.videoAnalysis,
    evaluationQuestion.videoAnalysisResult,
    feedbackQuestion.videoAnalysis,
    feedbackQuestion.videoNotes,
    null,
  );
  const codeEvaluation = firstDefined(
    evaluationQuestion.codeEvaluation,
    evaluationQuestion.codeEvaluationResult,
    feedbackQuestion.codeEvaluation,
    feedbackQuestion.codeNotes,
    null,
  );

  return {
    questionId: firstDefined(feedbackQuestion.questionId, evaluationQuestion.questionId, evaluationQuestion.id),
    order: firstDefined(feedbackQuestion.order, evaluationQuestion.order, 0),
    questionType: firstDefined(feedbackQuestion.questionType, evaluationQuestion.questionType, evaluationQuestion.skillType),
    skillType: firstDefined(feedbackQuestion.skillType, evaluationQuestion.skillType),
    topic: firstDefined(feedbackQuestion.topic, feedbackQuestion.topicName, evaluationQuestion.topic, evaluationQuestion.topicName),
    subtopic: firstDefined(feedbackQuestion.subtopic, feedbackQuestion.subtopicName, evaluationQuestion.subtopic, evaluationQuestion.subtopicName),
    questionText: firstDefined(feedbackQuestion.questionText, evaluationQuestion.questionText, ''),
    summary: firstDefined(feedbackQuestion.summary, ''),
    answerText: firstDefined(feedbackQuestion.answerText, evaluationQuestion.answerText, ''),
    transcription: firstDefined(feedbackQuestion.transcription, evaluationQuestion.transcription, ''),
    startTimeMs: asScore(firstDefined(feedbackQuestion.startTimeMs, evaluationQuestion.startTimeMs)),
    endTimeMs: asScore(firstDefined(feedbackQuestion.endTimeMs, evaluationQuestion.endTimeMs)),
    finalScore: asScore(firstDefined(feedbackQuestion.score, feedbackQuestion.finalScore, evaluationQuestion.finalScore)),
    scores: {
      semantic: asScore(firstDefined(evaluationQuestion.semanticScore, semanticEvaluation?.overallSemanticScore)),
      audio: asScore(firstDefined(evaluationQuestion.audioScore, audioAnalysis?.fluencyScore)),
      video: asScore(firstDefined(evaluationQuestion.videoScore)),
      code: asScore(firstDefined(evaluationQuestion.codeScore, codeEvaluation?.executionScore)),
    },
    strengths: asArray(firstDefined(feedbackQuestion.strengths, evaluationQuestion.strengths)),
    weaknesses: asArray(firstDefined(feedbackQuestion.weaknesses, evaluationQuestion.weaknesses)),
    recommendations: asArray(firstDefined(feedbackQuestion.recommendations, evaluationQuestion.recommendations)),
    semanticEvaluation,
    audioAnalysis,
    videoAnalysis,
    codeEvaluation,
    status: firstDefined(feedbackQuestion.status, evaluationQuestion.status),
    codeSubmission: firstDefined(feedbackQuestion.codeSubmission, evaluationQuestion.codeSubmission),
  };
};

export function normalizeFeedbackData({ feedback, evaluation, evaluationQuestions, interview }) {
  const feedbackQuestions = feedback?.questions || feedback?.report?.questions || [];
  const evaluatedQuestions = evaluationQuestions?.questions || evaluation?.questions || [];
  const evaluationByQuestionId = new Map(evaluatedQuestions.map((question) => [question.questionId || question.id, question]));
  const allQuestionIds = new Set([
    ...feedbackQuestions.map((question) => question.questionId || question.id),
    ...evaluatedQuestions.map((question) => question.questionId || question.id),
  ].filter(Boolean));

  const questions = [...allQuestionIds]
    .map((questionId) => normalizeQuestion({
      feedbackQuestion: feedbackQuestions.find((question) => (question.questionId || question.id) === questionId) || {},
      evaluationQuestion: evaluationByQuestionId.get(questionId) || {},
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return {
    interviewId: firstDefined(feedback?.interviewId, evaluation?.interviewId, interview?.interviewId),
    videoMediaId: firstDefined(feedback?.videoMediaId, evaluation?.videoMediaId, evaluation?.mediaId, interview?.videoMediaId),
    status: firstDefined(feedback?.status, evaluation?.status),
    overallScore: asScore(firstDefined(feedback?.scores?.overall, feedback?.overallScore, evaluation?.overallScore)),
    scores: {
      technical: asScore(firstDefined(feedback?.scores?.technical, evaluation?.technicalScore)),
      softSkills: asScore(firstDefined(feedback?.scores?.softSkills, evaluation?.softSkillsScore)),
      code: asScore(firstDefined(feedback?.scores?.code, evaluation?.codeScore)),
      audio: asScore(firstDefined(feedback?.scores?.audio, evaluation?.audioScore)),
      video: asScore(firstDefined(feedback?.scores?.video, evaluation?.videoScore)),
      semantic: asScore(firstDefined(feedback?.scores?.semantic, evaluation?.semanticScore)),
    },
    summary: firstDefined(feedback?.summary?.executiveSummary, feedback?.summary, evaluation?.summary?.executiveSummary, evaluation?.summary, ''),
    level: firstDefined(feedback?.summary?.generalLevel, feedback?.generalLevel),
    strengths: asArray(feedback?.strengths),
    weaknesses: asArray(firstDefined(feedback?.improvementAreas, feedback?.weaknesses)),
    recommendations: asArray(feedback?.recommendations),
    sections: feedback?.sections || {},
    questions,
  };
}
