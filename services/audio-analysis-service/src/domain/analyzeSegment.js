function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function pseudoRandomFromString(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

export function analyzeSegment({ questionId, start, end }) {
  const duration = Math.max(0, Number(end) - Number(start));
  const seed = pseudoRandomFromString(`${questionId}:${start}:${end}`);

  const speechRate = Math.round(110 + seed * 55);
  const pauseRatio = clamp(0.12 + (duration % 17) / 100 + seed * 0.05, 0.05, 0.6);
  const confidenceScore = clamp(0.55 + seed * 0.35 - Math.abs(speechRate - 135) / 300);
  const fluencyScore = clamp(0.5 + (1 - pauseRatio) * 0.4 + seed * 0.1);

  return {
    questionId,
    speechRate,
    pauseRatio: Number(pauseRatio.toFixed(3)),
    confidenceScore: Number(confidenceScore.toFixed(3)),
    fluencyScore: Number(fluencyScore.toFixed(3)),
    durationSeconds: Number(duration.toFixed(3)),
  };
}
