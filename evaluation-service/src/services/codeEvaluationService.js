const { clampScore } = require('../utils/scoreUtils');

const normalizeOutput = (value) => String(value || '').trim().replace(/\r\n/g, '\n');

const hasBasicStructure = (sourceCode) => /function|class|=>|for\s*\(|while\s*\(|if\s*\(|return|def\s+|public\s+|const\s+|let\s+/i.test(sourceCode);

const evaluateCode = ({ skillType, codeSubmission }) => {
  if (skillType !== 'CODE') return null;

  if (!codeSubmission || !codeSubmission.sourceCode) {
    return {
      codeScore: null,
      passedTests: 0,
      totalTests: 0,
      compilationStatus: 'NO_CODE_SUBMISSION',
      runtimeError: null,
      simulated: true,
      rawData: {
        simulated: true,
        status: 'NO_CODE_SUBMISSION',
        notes: 'No code submission was available for this CODE question.',
      },
    };
  }

  const expected = codeSubmission.expectedOutput;
  const actual = codeSubmission.actualOutput;
  let passedTests = 0;
  let totalTests = 1;
  let score;
  let notes;

  if (expected !== undefined && expected !== null && actual !== undefined && actual !== null) {
    passedTests = normalizeOutput(expected) === normalizeOutput(actual) ? 1 : 0;
    score = passedTests ? 92 : 45;
    notes = passedTests
      ? 'Expected output and actual output match in simulated evaluation.'
      : 'Expected output and actual output differ in simulated evaluation.';
  } else {
    const sourceCode = String(codeSubmission.sourceCode || '');
    const lengthScore = sourceCode.trim().length > 40 ? 35 : 15;
    const structureScore = hasBasicStructure(sourceCode) ? 35 : 10;
    const nonEmptyScore = sourceCode.trim() ? 20 : 0;
    score = nonEmptyScore + lengthScore + structureScore;
    passedTests = score >= 70 ? 1 : 0;
    notes = 'No expected output was provided; score uses simple source-code heuristics.';
  }

  return {
    codeScore: clampScore(score),
    passedTests,
    totalTests,
    compilationStatus: 'SIMULATED',
    runtimeError: null,
    simulated: true,
    rawData: {
      simulated: true,
      status: 'SIMULATED_JUDGE0',
      passedTests,
      totalTests,
      notes: `${notes} Judge0 real integration pending.`,
    },
  };
};

module.exports = {
  evaluateCode,
};
