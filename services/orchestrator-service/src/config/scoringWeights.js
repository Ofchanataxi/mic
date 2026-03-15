export const DEFAULT_WEIGHTS = {
  semantic: 0.4,
  audio: 0.2,
  video: 0.15,
  code: 0.25,
};

export function normalizeWeights(weights = DEFAULT_WEIGHTS) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    throw new Error('Scoring weights must have a positive sum');
  }

  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, value / total]),
  );
}
