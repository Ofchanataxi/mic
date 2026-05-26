const { clampScore } = require('../utils/scoreUtils');
const judge0Client = require('../clients/judge0Client');

const normalizeOutput = (value) => String(value || '').trim().replace(/\r\n/g, '\n');

const scoreJudge0Result = ({ result, expectedOutput }) => {
  const statusId = result.status?.id;
  const statusDescription = result.status?.description || 'UNKNOWN';
  const accepted = statusId === 3;
  const hasExpectedOutput = expectedOutput !== undefined && expectedOutput !== null && expectedOutput !== '';
  const outputMatches = hasExpectedOutput
    ? normalizeOutput(result.stdout) === normalizeOutput(expectedOutput)
    : accepted;

  let score = 0;
  if (accepted && outputMatches) score = 100;
  else if (accepted) score = 70;
  else if ([6, 7].includes(statusId)) score = 20;
  else if ([4, 5].includes(statusId)) score = 35;
  else score = 25;

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
  codeScore: 30,
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

  return scoreJudge0Result({
    result,
    expectedOutput: codeSubmission.expectedOutput,
  });
};

module.exports = {
  evaluateCode,
};
