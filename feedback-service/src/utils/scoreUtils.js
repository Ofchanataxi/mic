const clampScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Math.max(0, Math.min(100, Number(value)));
};

const levelFromScore = (score) => {
  const normalized = clampScore(score);
  if (normalized === null || normalized < 60) return 'BAJO';
  if (normalized < 80) return 'MEDIO';
  return 'ALTO';
};

module.exports = {
  clampScore,
  levelFromScore,
};
