const { ApiError } = require("../utils/apiError");
const { SeniorityLevel } = require("../utils/constants");

function requireString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${fieldName} is required`);
  }

  return value.trim();
}

function optionalString(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  return value.trim();
}

function optionalLevel(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (!Object.values(SeniorityLevel).includes(value)) {
    throw new ApiError(400, "level must be JUNIOR, MID or SENIOR");
  }

  return value;
}

function validateCreateProfileFromCv(body) {
  return {
    userId: requireString(body.userId, "userId"),
    mediaId: requireString(body.mediaId, "mediaId"),
    targetRole: optionalString(body.targetRole, "targetRole"),
    level: optionalLevel(body.level)
  };
}

function validateAdaptiveStrategyQuery(query) {
  const questionCount = Number.parseInt(query.questionCount, 10);

  if (!Number.isInteger(questionCount) || questionCount <= 0) {
    throw new ApiError(400, "questionCount is required and must be a positive integer");
  }

  return {
    questionCount,
    targetRole: optionalString(query.targetRole, "targetRole"),
    level: optionalLevel(query.level)
  };
}

function validatePerformancePayload(body) {
  const interviewId = requireString(body.interviewId, "interviewId");

  if (!Array.isArray(body.results) || body.results.length === 0) {
    throw new ApiError(400, "results must be a non-empty array");
  }

  const results = body.results.map((result, index) => {
    const score = Number(result.score);

    if (Number.isNaN(score) || score < 0 || score > 100) {
      throw new ApiError(400, `results[${index}].score must be between 0 and 100`);
    }

    return {
      candidateSubtopicId: requireString(result.candidateSubtopicId, `results[${index}].candidateSubtopicId`),
      questionId: optionalString(result.questionId, `results[${index}].questionId`),
      score,
      evaluationType: optionalString(result.evaluationType, `results[${index}].evaluationType`),
      feedback: optionalString(result.feedback, `results[${index}].feedback`)
    };
  });

  return {
    interviewId,
    results
  };
}

module.exports = {
  validateCreateProfileFromCv,
  validateAdaptiveStrategyQuery,
  validatePerformancePayload
};
