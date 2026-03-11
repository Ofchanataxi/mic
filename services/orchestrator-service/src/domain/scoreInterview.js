import { DEFAULT_WEIGHTS, normalizeWeights } from '../config/scoringWeights.js';

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function bounded(value) {
  return Math.max(0, Math.min(1, value));
}

function semanticComposite(semantic) {
  if (!semantic) return 0;
  return bounded(avg([semantic.technicalScore, semantic.clarityScore, semantic.depthScore]));
}

function audioComposite(audio) {
  if (!audio) return 0;
  const pauseBalance = 1 - Math.abs(audio.pauseRatio - 0.2);
  const speechRateBalance = 1 - Math.abs(audio.speechRate - 130) / 130;
  return bounded(avg([audio.confidenceScore, pauseBalance, speechRateBalance]));
}

function videoComposite(video) {
  if (!video) return 0;
  const movementBalance = 1 - video.nervousMovementScore;
  return bounded(avg([video.eyeContactScore, video.postureScore, movementBalance]));
}

function codeComposite(code) {
  if (!code) return 0;
  const compilePenalty = code.compileError ? 0.5 : 1;
  return bounded(code.codeScore * compilePenalty);
}

export function scoreInterview(mergedResults, customWeights = DEFAULT_WEIGHTS) {
  const weights = normalizeWeights(customWeights);

  const questionResults = mergedResults.map((row) => {
    const semanticScore = semanticComposite(row.semantic);
    const audioScore = audioComposite(row.audio);
    const videoScore = videoComposite(row.video);
    const codeScore = codeComposite(row.code);

    const overallScore = bounded(
      semanticScore * weights.semantic +
        audioScore * weights.audio +
        videoScore * weights.video +
        codeScore * weights.code,
    );

    const inconsistencyFlags = [];
    if (semanticScore >= 0.7 && avg([audioScore, videoScore]) < 0.45) {
      inconsistencyFlags.push('strong_content_low_delivery');
    }
    if (semanticScore < 0.45 && avg([audioScore, videoScore]) >= 0.7) {
      inconsistencyFlags.push('confident_delivery_weak_content');
    }

    return {
      questionId: row.questionId,
      semanticScore,
      audioScore,
      videoScore,
      codeScore,
      overallScore,
      inconsistencyFlags,
      justification: row.semantic?.justification ?? 'Sin justificación disponible',
    };
  });

  const globalScore = avg(questionResults.map((q) => q.overallScore));

  return {
    questionResults,
    globalScore,
    weights,
  };
}
