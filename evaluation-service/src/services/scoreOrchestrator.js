const env = require('../config/env');
const { average, clampScore, scoreLevel } = require('../utils/scoreUtils');

const weightedScore = (parts) => {
  const valid = parts
    .map((part) => ({ score: clampScore(part.score), weight: Number(part.weight) || 0 }))
    .filter((part) => part.score !== null && part.weight > 0);
  const weightSum = valid.reduce((sum, part) => sum + part.weight, 0);
  if (!valid.length || !weightSum) return null;
  const total = valid.reduce((sum, part) => sum + part.score * part.weight, 0) / weightSum;
  return clampScore(Number(total.toFixed(2)));
};

const calculateQuestionScore = ({ skillType, semanticScore, audioScore, videoScore, codeScore }) => {
  if (skillType === 'CODE') {
    return weightedScore([
      { score: codeScore, weight: env.scoreWeights.codeCode },
      { score: semanticScore, weight: env.scoreWeights.codeSemantic },
    ]);
  }

  if (skillType === 'SOFT') {
    return weightedScore([
      { score: semanticScore, weight: env.scoreWeights.softSemantic },
      { score: audioScore, weight: env.scoreWeights.softAudio },
      { score: videoScore, weight: env.scoreWeights.softVideo },
    ]);
  }

  return weightedScore([
    { score: semanticScore, weight: env.scoreWeights.technicalSemantic },
    { score: audioScore, weight: env.scoreWeights.technicalAudio },
    { score: videoScore, weight: env.scoreWeights.technicalVideo },
  ]);
};

const calculateGlobalScores = (questions) => {
  const completed = questions.filter((question) => question.status === 'COMPLETED' && question.finalScore !== null && question.finalScore !== undefined);
  const byType = (skillType) => completed.filter((question) => question.skillType === skillType).map((question) => question.finalScore);

  return {
    overallScore: average(completed.map((question) => question.finalScore)),
    technicalScore: average(byType('TECHNICAL')),
    softSkillsScore: average(byType('SOFT')),
    codeScore: average(byType('CODE')),
    semanticScore: average(completed.map((question) => question.semanticScore)),
    audioScore: average(completed.map((question) => question.audioScore)),
    videoScore: average(completed.map((question) => question.videoScore)),
    totalQuestions: questions.length,
    evaluatedQuestions: completed.length,
    failedQuestions: questions.filter((question) => question.status === 'FAILED' || question.status === 'SKIPPED').length,
  };
};

const buildSummary = (questions, globalScores) => {
  const completed = questions.filter((question) => question.status === 'COMPLETED');
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  completed.forEach((question) => {
    (question.strengths || []).slice(0, 1).forEach((item) => strengths.push(item));
    (question.weaknesses || []).slice(0, 1).forEach((item) => weaknesses.push(item));
    (question.recommendations || []).slice(0, 1).forEach((item) => recommendations.push(item));
  });

  return {
    overall: {
      score: globalScores.overallScore,
      level: scoreLevel(globalScores.overallScore),
    },
    strengths: [...new Set(strengths)].slice(0, 5),
    weaknesses: [...new Set(weaknesses)].slice(0, 5),
    recommendations: [...new Set(recommendations)].slice(0, 5),
    questionBreakdown: questions.map((question) => ({
      questionId: question.questionId,
      score: question.finalScore,
      skillType: question.skillType,
    })),
  };
};

module.exports = {
  calculateQuestionScore,
  calculateGlobalScores,
  buildSummary,
};
