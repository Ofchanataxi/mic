function topByScore(rows, direction = 'desc', limit = 3) {
  const sorted = [...rows].sort((a, b) =>
    direction === 'desc' ? b.overallScore - a.overallScore : a.overallScore - b.overallScore,
  );
  return sorted.slice(0, limit);
}

export function buildFeedbackReport({ interviewId, questionResults, globalScore }) {
  const strengths = topByScore(questionResults, 'desc').map((q) => ({
    questionId: q.questionId,
    reason: `Buen desempeño general (${(q.overallScore * 100).toFixed(0)}%).`,
  }));

  const improvementAreas = topByScore(questionResults, 'asc').map((q) => ({
    questionId: q.questionId,
    reason: `Priorizar mejora en claridad técnica y delivery (${(q.overallScore * 100).toFixed(0)}%).`,
  }));

  return {
    interviewId,
    summary: {
      level: globalScore >= 0.75 ? 'ALTO' : globalScore >= 0.55 ? 'MEDIO' : 'EN_DESARROLLO',
      globalScore,
      strengths,
      improvementAreas,
    },
    sections: {
      technical: questionResults.map((q) => ({ questionId: q.questionId, score: q.semanticScore })),
      communication: questionResults.map((q) => ({
        questionId: q.questionId,
        score: (q.audioScore + q.videoScore) / 2,
      })),
      coding: questionResults.map((q) => ({ questionId: q.questionId, score: q.codeScore })),
    },
    questionBreakdown: questionResults.map((q) => ({
      questionId: q.questionId,
      score: q.overallScore,
      inconsistencies: q.inconsistencyFlags,
      justification: q.justification,
      recommendation:
        q.overallScore < 0.6
          ? 'Practicar respuestas estructuradas (STAR) y reforzar fundamentos técnicos de este dominio.'
          : 'Mantener el nivel y profundizar con ejemplos cuantificables de impacto.',
    })),
  };
}
