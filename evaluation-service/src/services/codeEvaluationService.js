const { clampScore } = require('../utils/scoreUtils');
const judge0Client = require('../clients/judge0Client');
const { containsInjectionAttempt } = require('./semanticEvaluationService');

const normalizeOutput = (value) => String(value || '').trim().replace(/\r\n/g, '\n');

const scoreJudge0Result = ({ result, expectedOutput }) => {
  const statusId = result.status?.id;
  const statusDescription = result.status?.description || 'UNKNOWN';
  const accepted = statusId === 3;
  const hasExpectedOutput = expectedOutput !== undefined && expectedOutput !== null && expectedOutput !== '';
  const outputMatches = hasExpectedOutput
    ? normalizeOutput(result.stdout) === normalizeOutput(expectedOutput)
    : null;

  let score = 0;
  if (accepted && hasExpectedOutput && outputMatches) score = 100;
  else if (accepted && hasExpectedOutput) score = 20;
  else if (accepted) score = 40;
  else if ([6, 7].includes(statusId)) score = 5;
  else if ([4, 5].includes(statusId)) score = 10;
  else score = 5;

  return {
    codeScore: clampScore(score),
    passedTests: accepted && outputMatches ? 1 : 0,
    totalTests: 1,
    compilationStatus: statusDescription,
    runtimeError: result.stderr || result.compile_output || null,
    simulated: false,
    rawData: {
      simulated: false,
      status: 'JUDGE0_EXECUTED',
      judge0Status: result.status || null,
      stdout: result.stdout || null,
      stderr: result.stderr || null,
      compileOutput: result.compile_output || null,
      time: result.time || null,
      memory: result.memory || null,
      outputMatches,
    },
  };
};

const judge0FailureResult = (error) => ({
  codeScore: null,
  passedTests: 0,
  totalTests: 1,
  compilationStatus: 'JUDGE0_REQUEST_FAILED',
  runtimeError: error.response?.data
    ? JSON.stringify(error.response.data).slice(0, 1000)
    : error.message,
  simulated: false,
  rawData: {
    simulated: false,
    status: 'JUDGE0_REQUEST_FAILED',
    httpStatus: error.response?.status || null,
    details: error.response?.data || null,
    notes: 'Judge0 failed to execute the submission. The CODE question is kept evaluable using semantic/code explanation signals.',
  },
});

const evaluateCode = async ({ skillType, codeSubmission }) => {
  if (skillType !== 'CODE') return null;

  if (!codeSubmission || !codeSubmission.sourceCode) {
    return {
      codeScore: null,
      passedTests: 0,
      totalTests: 0,
      compilationStatus: 'NO_CODE_SUBMISSION',
      runtimeError: null,
      simulated: false,
      rawData: {
        simulated: false,
        status: 'NO_CODE_SUBMISSION',
        notes: 'No code submission was available for this CODE question.',
      },
    };
  }

  if (!judge0Client.isConfigured()) {
    return {
      codeScore: null,
      passedTests: 0,
      totalTests: 0,
      compilationStatus: 'JUDGE0_NOT_CONFIGURED',
      runtimeError: null,
      simulated: false,
      rawData: {
        simulated: false,
        status: 'JUDGE0_NOT_CONFIGURED',
        notes: 'JUDGE0_API_KEY is required to execute CODE questions.',
      },
    };
  }

  const injectionDetected = containsInjectionAttempt(codeSubmission.sourceCode);
  let result;
  try {
    result = await judge0Client.submitCode({
      language: codeSubmission.language,
      sourceCode: codeSubmission.sourceCode,
      stdin: codeSubmission.stdin,
      expectedOutput: codeSubmission.expectedOutput,
    });
  } catch (error) {
    return judge0FailureResult(error);
  }

  const evaluated = scoreJudge0Result({
    result,
    expectedOutput: codeSubmission.expectedOutput,
  });
  if (!injectionDetected) return evaluated;

  return {
    ...evaluated,
    codeScore: Math.min(evaluated.codeScore, 10),
    rawData: {
      ...evaluated.rawData,
      status: 'MANIPULATION_ATTEMPT_DETECTED',
      notes: 'The submission contains text intended to influence grading rather than solve the exercise.',
    },
  };
};

module.exports = {
  evaluateCode,
};
