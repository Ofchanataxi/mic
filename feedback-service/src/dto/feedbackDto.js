const formatQuestion = (question) => ({
  questionId: question.questionId,
  order: question.order,
  skillType: question.skillType,
  questionText: question.questionText,
  score: question.score,
  summary: question.summary,
  strengths: question.strengths || [],
  weaknesses: question.weaknesses || [],
  recommendations: question.recommendations || [],
  semanticNotes: question.semanticNotes,
  audioNotes: question.audioNotes,
  videoNotes: question.videoNotes,
  codeNotes: question.codeNotes,
});

const formatReport = (report) => ({
  interviewId: report.interviewId,
  userId: report.userId,
  status: report.status,
  scores: {
    overall: report.overallScore,
    technical: report.technicalScore,
    softSkills: report.softSkillsScore,
    code: report.codeScore,
    audio: report.audioScore,
    video: report.videoScore,
    semantic: report.generatedReport?.scores?.semantic ?? report.rawEvaluationData?.semanticScore ?? null,
  },
  summary: {
    executiveSummary: report.executiveSummary,
    generalLevel: report.generalLevel,
  },
  strengths: report.strengths || [],
  improvementAreas: report.improvementAreas || [],
  recommendations: report.recommendations || [],
  sections: {
    technical: report.technicalFeedback || {},
    softSkills: report.softSkillsFeedback || {},
    code: report.codeFeedback || {},
    audio: report.audioFeedback || {},
    video: report.videoFeedback || {},
  },
  multimodalObservations: report.multimodalObservations || [],
  questions: (report.questionDetails || []).map(formatQuestion),
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
});

module.exports = {
  formatReport,
  formatQuestion,
};
