const { clampScore } = require('../utils/scoreUtils');
const judge0Client = require('../clients/judge0Client');
const { containsInjectionAttempt } = require('./semanticEvaluationService');

const normalizeOutput = (value) => String(value || '').trim().replace(/\r\n/g, '\n');

const mapJudge0Result = ({ result, testCase, index }) => {
  const statusId = result.status?.id;
  const statusDescription = result.status?.description || 'UNKNOWN';
  const accepted = statusId === 3;
  const outputMatches = normalizeOutput(result.stdout) === normalizeOutput(testCase.expectedOutput);
  const passed = accepted && outputMatches;

  return {
    name: testCase.name || `Caso ${index + 1}`,
    passed,
    status: statusDescription,
    statusId,
    stdout: result.stdout || '',
    stderr: result.stderr || null,
    compileOutput: result.compile_output || null,
    time: result.time || null,
    memory: result.memory || null,
  };
};

const judge0FailureResult = (error, totalTests = 0) => ({
  codeScore: null,
  passedTests: 0,
  totalTests,
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

const normalizeTestCases = (codeSubmission) => {
  if (Array.isArray(codeSubmission.testCases) && codeSubmission.testCases.length > 0) {
    return codeSubmission.testCases
      .filter((testCase) => typeof testCase?.expectedOutput === 'string')
      .slice(0, 5);
  }
  if (codeSubmission.expectedOutput !== undefined && codeSubmission.expectedOutput !== null) {
    return [{
      name: 'Caso principal',
      stdin: codeSubmission.stdin || '',
      expectedOutput: String(codeSubmission.expectedOutput),
    }];
  }
  return [];
};

const evaluateTestCases = async ({ codeSubmission, testCases }) => {
  const results = [];
  for (let index = 0; index < testCases.length; index += 1) {
    const testCase = testCases[index];
    const result = await judge0Client.submitCode({
      language: codeSubmission.language,
      sourceCode: codeSubmission.sourceCode,
      stdin: testCase.stdin || '',
      expectedOutput: testCase.expectedOutput,
    });
    results.push(mapJudge0Result({ result, testCase, index }));
    if ([6, 7].includes(result.status?.id)) break;
  }
  return results;
};

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
  const testCases = normalizeTestCases(codeSubmission);
  if (testCases.length === 0) {
    return {
      codeScore: null,
      passedTests: 0,
      totalTests: 0,
      compilationStatus: 'NO_TEST_CASES',
      runtimeError: null,
      simulated: false,
      rawData: {
        simulated: false,
        status: 'NO_TEST_CASES',
        notes: 'The coding question did not include verifiable test cases.',
      },
    };
  }

  let testResults;
  try {
    testResults = await evaluateTestCases({ codeSubmission, testCases });
  } catch (error) {
    return judge0FailureResult(error, testCases.length);
  }

  const passedTests = testResults.filter((result) => result.passed).length;
  const compilationFailure = testResults.find((result) => [6, 7].includes(result.statusId));
  const runtimeFailure = testResults.find((result) => [5, 8, 9, 10, 11, 12].includes(result.statusId));
  const evaluated = {
    codeScore: clampScore(Number(((passedTests / testCases.length) * 100).toFixed(2))),
    passedTests,
    totalTests: testCases.length,
    compilationStatus: compilationFailure?.status || runtimeFailure?.status || 'EXECUTED',
    runtimeError: compilationFailure?.compileOutput || runtimeFailure?.stderr || null,
    simulated: false,
    rawData: {
      simulated: false,
      status: 'JUDGE0_TESTS_EXECUTED',
      passedTests,
      totalTests: testCases.length,
      testResults,
    },
  };
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
