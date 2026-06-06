const { ApiError } = require("../utils/apiError");

const SENIORITY_LEVELS = new Set(["JUNIOR", "MID", "SENIOR"]);
const MAX_INTERVIEW_DURATION_MS = 30 * 60 * 1000;

function assertString(value, fieldName, required = true) {
  if ((value === undefined || value === null || value === "") && !required) {
    return;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${fieldName} must be a non-empty string`);
  }
}

function parseOptionalDate(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid datetime`);
  }

  return date;
}

function validateCreateInterview(body) {
  assertString(body.userId, "userId");
  assertString(body.candidateProfileId, "candidateProfileId");
  assertString(body.targetRole, "targetRole", false);

  if (body.level !== undefined && body.level !== null && !SENIORITY_LEVELS.has(body.level)) {
    throw new ApiError(400, "level must be one of JUNIOR, MID or SENIOR");
  }

  const questionCount = body.questionCount === undefined || body.questionCount === null
    ? 8
    : Number.parseInt(body.questionCount, 10);

  if (!Number.isInteger(questionCount)) {
    throw new ApiError(400, "questionCount must be an integer");
  }

  if (questionCount !== 8) {
    throw new ApiError(400, "Interviews must contain exactly 8 questions");
  }

  return {
    userId: body.userId.trim(),
    candidateProfileId: body.candidateProfileId.trim(),
    targetRole: body.targetRole ? body.targetRole.trim() : null,
    level: body.level || null,
    questionCount
  };
}

function validateFinishInterview(body) {
  assertString(body.videoMediaId, "videoMediaId");

  if (!Array.isArray(body.responses) || body.responses.length === 0) {
    throw new ApiError(400, "responses must be a non-empty array");
  }

  const responses = body.responses.map((response, index) => {
    assertString(response.questionId, `responses[${index}].questionId`);

    const videoStartMs = Number.parseInt(response.videoStartMs, 10);
    const videoEndMs = Number.parseInt(response.videoEndMs, 10);

    if (!Number.isInteger(videoStartMs) || videoStartMs < 0) {
      throw new ApiError(400, `responses[${index}].videoStartMs must be a non-negative integer`);
    }

    if (!Number.isInteger(videoEndMs) || videoEndMs < videoStartMs) {
      throw new ApiError(400, `responses[${index}].videoEndMs must be greater than or equal to videoStartMs`);
    }

    if (videoStartMs > MAX_INTERVIEW_DURATION_MS || videoEndMs > MAX_INTERVIEW_DURATION_MS) {
      throw new ApiError(400, `responses[${index}] exceeds the maximum interview duration of 30 minutes`);
    }

    let codeSubmission = null;
    if (response.codeSubmission !== undefined && response.codeSubmission !== null) {
      assertString(response.codeSubmission.code, `responses[${index}].codeSubmission.code`);
      assertString(response.codeSubmission.language, `responses[${index}].codeSubmission.language`, false);
      codeSubmission = {
        language: response.codeSubmission.language || null,
        code: response.codeSubmission.code
      };
    }

    return {
      questionId: response.questionId.trim(),
      answerText: typeof response.answerText === "string" ? response.answerText : null,
      videoStartMs,
      videoEndMs,
      answerStartedAt: parseOptionalDate(response.answerStartedAt, `responses[${index}].answerStartedAt`),
      answerEndedAt: parseOptionalDate(response.answerEndedAt, `responses[${index}].answerEndedAt`),
      codeSubmission
    };
  });

  return {
    videoMediaId: body.videoMediaId.trim(),
    responses
  };
}

module.exports = {
  validateCreateInterview,
  validateFinishInterview
};
