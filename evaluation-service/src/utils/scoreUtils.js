const clampScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Math.max(0, Math.min(100, Number(value)));
};

const average = (values) => {
  const valid = values.map(clampScore).filter((value) => value !== null);
  if (!valid.length) return null;
  return Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(2));
};

const scoreLevel = (score) => {
  if (score === null || score === undefined) return 'LOW';
  if (score >= 75) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
};

module.exports = {
  clampScore,
  average,
  scoreLevel,
};
