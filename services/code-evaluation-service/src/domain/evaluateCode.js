const LOOP_REGEX = /\b(for|while)\b/g;
const CONDITIONAL_REGEX = /\b(if|switch|case)\b/g;
const FUNCTION_REGEX = /\b(function|def|class|=>|public\s+static|private\s+static)\b/g;
const COMMENT_REGEX = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#.*$)/gm;
const TEST_HINT_REGEX = /assert|expect\(|console\.log|print\(/g;
const ERROR_HINT_REGEX = /TODO|FIXME|NotImplemented|pass\s*$/gm;

function countMatches(source, regex) {
  return (source.match(regex) ?? []).length;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLanguage(language) {
  return language.toLowerCase();
}

function estimateTestTotals(language) {
  const normalized = normalizeLanguage(language);

  if (normalized === 'java' || normalized === 'cpp') {
    return 12;
  }

  if (normalized === 'python') {
    return 10;
  }

  return 8;
}

export function evaluateCode({ sourceCode, language, maxEstimatedComplexity }) {
  const normalizedLanguage = normalizeLanguage(language);
  const trimmedSource = sourceCode.trim();
  const lines = trimmedSource ? trimmedSource.split(/\r?\n/) : [];

  const nonEmptyLines = lines.filter((line) => line.trim().length > 0).length;
  const commentLines = countMatches(sourceCode, COMMENT_REGEX);
  const loops = countMatches(sourceCode, LOOP_REGEX);
  const conditionals = countMatches(sourceCode, CONDITIONAL_REGEX);
  const abstractions = countMatches(sourceCode, FUNCTION_REGEX);
  const testHints = countMatches(sourceCode, TEST_HINT_REGEX);
  const errorHints = countMatches(sourceCode, ERROR_HINT_REGEX);

  const structuralScore = clamp((abstractions * 0.18) + (conditionals * 0.05) + (loops * 0.08));
  const readabilityScore = clamp((commentLines / Math.max(nonEmptyLines, 1)) * 1.8 + (nonEmptyLines >= 8 ? 0.25 : 0));
  const maintainabilityScore = clamp((structuralScore * 0.55) + (readabilityScore * 0.45) - (errorHints * 0.12));
  const estimatedComplexity = Math.min(maxEstimatedComplexity, (loops * 8) + (conditionals * 4) + (abstractions * 3) + Math.ceil(nonEmptyLines / 12));
  const complexityPenalty = clamp((estimatedComplexity - 35) / Math.max(maxEstimatedComplexity - 35, 1));
  const correctnessScore = clamp(0.45 + structuralScore * 0.35 + (testHints > 0 ? 0.12 : 0) - (errorHints * 0.1) - (complexityPenalty * 0.18));

  const totalTests = estimateTestTotals(normalizedLanguage);
  const passedTests = Math.max(0, Math.min(totalTests, Math.round(totalTests * correctnessScore)));
  const compileError = nonEmptyLines < 2 || errorHints > 0
    ? 'Simulated validation detected incomplete implementation.'
    : null;
  const status = compileError ? 'FAILED' : 'COMPLETED';
  const score = Number((((correctnessScore * 0.6) + (maintainabilityScore * 0.25) + (readabilityScore * 0.15)) * 100).toFixed(2));

  return {
    status,
    passedTests,
    totalTests,
    compileError,
    score,
    executionTime: Number((0.08 + estimatedComplexity / 500).toFixed(3)),
    memoryUsage: Number((12 + estimatedComplexity * 0.9).toFixed(2)),
    analysisMode: 'simulated-heuristic',
    metadata: {
      language: normalizedLanguage,
      nonEmptyLines,
      commentLines,
      loops,
      conditionals,
      abstractions,
      estimatedComplexity,
      readabilityScore: Number(readabilityScore.toFixed(3)),
      maintainabilityScore: Number(maintainabilityScore.toFixed(3)),
      correctnessScore: Number(correctnessScore.toFixed(3)),
      testHints,
      errorHints,
    },
  };
}
