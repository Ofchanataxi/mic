const { clampScore } = require('../utils/scoreUtils');

const countWords = (text) => {
  if (!text) return 0;
  const matches = String(text).trim().match(/\S+/g);
  return matches ? matches.length : 0;
};

const calculateFluencyScore = ({ wordCount, speechRate }) => {
  if (!wordCount) return null;
  let score = 100;
  if (speechRate < 70) score -= Math.min(50, (70 - speechRate) * 0.8);
  if (speechRate > 190) score -= Math.min(40, (speechRate - 190) * 0.5);
  if (wordCount < 12) score -= 25;
  return clampScore(Number(score.toFixed(2)));
};

const analyzeAudio = ({ transcription, durationMs }) => {
  const wordCount = countWords(transcription);
  const durationMinutes = durationMs ? durationMs / 60000 : 0;
  const speechRate = durationMinutes > 0 ? Number((wordCount / durationMinutes).toFixed(2)) : null;
  const fluencyScore = calculateFluencyScore({ wordCount, speechRate: speechRate || 0 });

  const confidenceIndicators = {
    responseLength: wordCount < 12 ? 'respuesta breve' : wordCount > 180 ? 'respuesta extensa' : 'respuesta moderada',
    speechRate: speechRate === null
      ? 'ritmo no estimado'
      : speechRate < 70
        ? 'ritmo de habla bajo'
        : speechRate > 190
          ? 'ritmo de habla alto'
          : 'ritmo de habla dentro de rango esperado',
    pauseEstimation: 'pausas no estimadas en MVP',
  };

  return {
    durationMs,
    wordCount,
    speechRate,
    pauseCount: null,
    averagePauseMs: null,
    fluencyScore,
    confidenceIndicators,
    rawData: {
      status: 'HEURISTIC_AUDIO_ANALYSIS',
      notes: 'Audio analysis uses transcription length and timestamp duration in this MVP.',
    },
  };
};

module.exports = {
  analyzeAudio,
};
