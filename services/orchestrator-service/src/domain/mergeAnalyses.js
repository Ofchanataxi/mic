function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function mergeByQuestion({ semanticResults = [], audioResults = [], videoResults = [], codeResults = [] }) {
  const bag = new Map();

  const ensure = (questionId) => {
    if (!bag.has(questionId)) {
      bag.set(questionId, { questionId, semantic: null, audio: null, video: null, code: null });
    }
    return bag.get(questionId);
  };

  semanticResults.forEach((item) => {
    const slot = ensure(item.questionId);
    slot.semantic = {
      technicalScore: safeNumber(item.technicalScore),
      clarityScore: safeNumber(item.clarityScore),
      depthScore: safeNumber(item.depthScore),
      justification: item.justification ?? '',
    };
  });

  audioResults.forEach((item) => {
    const slot = ensure(item.questionId);
    slot.audio = {
      speechRate: safeNumber(item.speechRate),
      pauseRatio: safeNumber(item.pauseRatio),
      confidenceScore: safeNumber(item.confidenceScore),
    };
  });

  videoResults.forEach((item) => {
    const slot = ensure(item.questionId);
    slot.video = {
      eyeContactScore: safeNumber(item.eyeContactScore),
      postureScore: safeNumber(item.postureScore),
      nervousMovementScore: safeNumber(item.nervousMovementScore),
    };
  });

  codeResults.forEach((item) => {
    const slot = ensure(item.questionId);
    const ratio = item.totalTests > 0 ? item.passedTests / item.totalTests : 0;
    slot.code = {
      passedTests: safeNumber(item.passedTests),
      totalTests: safeNumber(item.totalTests),
      codeScore: safeNumber(item.score, ratio),
      compileError: item.compileError ?? null,
    };
  });

  return Array.from(bag.values());
}
