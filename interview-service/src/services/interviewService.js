const candidateClient = require("../clients/candidateClient");
const evaluationClient = require("../clients/evaluationClient");
const interviewRepository = require("../repositories/interviewRepository");
const questionGenerationService = require("./questionGenerationService");
const { ApiError } = require("../utils/apiError");
const { env } = require("../config/env");

function mapQuestion(question, includeResponse = false) {
  const mapped = {
    questionId: question.id,
    candidateTopicId: question.candidateTopicId,
    candidateSubtopicId: question.candidateSubtopicId,
    skillType: question.skillType,
    topic: question.topic,
    subtopic: question.subtopic,
    questionType: question.questionType,
    prompt: question.prompt,
    language: question.language,
    expectedLevel: question.expectedLevel,
    orderIndex: question.orderIndex
  };

  if (includeResponse) {
    mapped.response = question.response
      ? {
          answerText: question.response.answerText,
          videoStartMs: question.response.videoStartMs,
          videoEndMs: question.response.videoEndMs,
          answerStartedAt: question.response.answerStartedAt,
          answerEndedAt: question.response.answerEndedAt,
          codeSubmission: question.codeSubmission
            ? {
                language: question.codeSubmission.language,
                code: question.codeSubmission.code
              }
            : null
        }
      : null;
  }

  return mapped;
}

function mapInterview(interview) {
  return {
    interviewId: interview.id,
    userId: interview.userId,
    candidateProfileId: interview.candidateProfileId,
    targetRole: interview.targetRole,
    level: interview.level,
    status: interview.status,
    evaluationStatus: interview.evaluationStatus,
    questionCount: interview.questionCount,
    videoMediaId: interview.videoMediaId,
    startedAt: interview.startedAt,
    finishedAt: interview.finishedAt,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
    questions: interview.questions.map((question) => mapQuestion(question))
  };
}

function mapInterviewSummary(interview) {
  return {
    interviewId: interview.id,
    candidateProfileId: interview.candidateProfileId,
    targetRole: interview.targetRole,
    level: interview.level,
    status: interview.status,
    evaluationStatus: interview.evaluationStatus,
    questionCount: interview.questionCount,
    videoMediaId: interview.videoMediaId,
    startedAt: interview.startedAt,
    finishedAt: interview.finishedAt,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt
  };
}

function assertPlanMatchesRequest(plan, input) {
  if (!Array.isArray(plan.evaluationPlan) || plan.evaluationPlan.length === 0) {
    throw new ApiError(502, "candidate-service returned an empty evaluation plan");
  }

  if (plan.candidateProfileId && plan.candidateProfileId !== input.candidateProfileId) {
    throw new ApiError(409, "candidate-service returned a different candidateProfileId", {
      requested: input.candidateProfileId,
      received: plan.candidateProfileId
    });
  }
}

function requiredCodingQuestions(questionCount) {
  if (questionCount >= 9) {
    return env.minCodingQuestionsLargeInterview;
  }
  if (questionCount >= 5) {
    return env.minCodingQuestionsSmallInterview;
  }
  return 0;
}

function applyCodingQuestionQuota(evaluationPlan, questionCount) {
  const plan = evaluationPlan.slice(0, questionCount).map((item) => ({ ...item }));
  const requiredCount = Math.min(
    requiredCodingQuestions(questionCount),
    plan.filter((item) => item.skillType !== "SOFT").length
  );

  if (requiredCount <= 0) {
    return plan;
  }

  const alreadyCoding = plan.filter((item) => item.forcedQuestionType === "CODING").length;
  let remaining = requiredCount - alreadyCoding;

  for (let index = plan.length - 1; index >= 0 && remaining > 0; index -= 1) {
    if (plan[index].skillType === "SOFT" || plan[index].forcedQuestionType === "CODING") {
      continue;
    }

    plan[index] = {
      ...plan[index],
      forcedQuestionType: "CODING",
      reason: `${plan[index].reason || "Coverage balance"} / coding quota`
    };
    remaining -= 1;
  }

  return plan;
}

async function createInterview(input) {
  const adaptiveStrategy = await candidateClient.getAdaptiveStrategy({
    userId: input.userId,
    questionCount: input.questionCount,
    targetRole: input.targetRole,
    level: input.level
  });

  assertPlanMatchesRequest(adaptiveStrategy, input);

  const evaluationPlan = applyCodingQuestionQuota(adaptiveStrategy.evaluationPlan, input.questionCount);
  const questions = await questionGenerationService.generateQuestionsForPlan({
    userId: input.userId,
    targetRole: input.targetRole || adaptiveStrategy.targetRole,
    level: input.level || adaptiveStrategy.level,
    evaluationPlan
  });

  const interview = await interviewRepository.createInterviewWithQuestions({
    interview: {
      userId: input.userId,
      candidateProfileId: input.candidateProfileId,
      targetRole: input.targetRole || adaptiveStrategy.targetRole || null,
      level: input.level || adaptiveStrategy.level || null,
      status: "CREATED",
      evaluationStatus: "NOT_REQUESTED",
      questionCount: questions.length
    },
    questions
  });

  return {
    interviewId: interview.id,
    status: interview.status,
    questionCount: interview.questionCount,
    questions: interview.questions.map((question) => mapQuestion(question))
  };
}

async function getInterview(id) {
  const interview = await interviewRepository.findById(id);

  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }

  return mapInterview(interview);
}

async function listInterviewsByUserId(userId) {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new ApiError(400, "userId query parameter is required");
  }

  const interviews = await interviewRepository.listByUserId(userId.trim());
  return {
    userId: userId.trim(),
    interviews: interviews.map(mapInterviewSummary)
  };
}

async function startInterview(id) {
  const interview = await interviewRepository.findById(id);

  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }

  if (interview.status !== "CREATED") {
    throw new ApiError(409, "Only CREATED interviews can be started");
  }

  const updated = await interviewRepository.markStarted(id, new Date());

  return {
    interviewId: updated.id,
    status: updated.status
  };
}

function validateResponsesBelongToInterview(interview, responses) {
  const questionIds = new Set(interview.questions.map((question) => question.id));
  const receivedIds = new Set();

  for (const response of responses) {
    if (!questionIds.has(response.questionId)) {
      throw new ApiError(400, "Response references a question that does not belong to the interview", {
        questionId: response.questionId
      });
    }

    if (receivedIds.has(response.questionId)) {
      throw new ApiError(400, "Duplicate response for question", {
        questionId: response.questionId
      });
    }

    receivedIds.add(response.questionId);
  }

  if (receivedIds.size !== questionIds.size) {
    throw new ApiError(400, "All interview questions must have a response", {
      expected: questionIds.size,
      received: receivedIds.size
    });
  }
}

async function finishInterview(id, input) {
  const interview = await interviewRepository.findById(id);

  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }

  if (interview.status !== "IN_PROGRESS") {
    throw new ApiError(409, "Only IN_PROGRESS interviews can be finished");
  }

  validateResponsesBelongToInterview(interview, input.responses);

  const finished = await interviewRepository.finishInterview({
    id,
    videoMediaId: input.videoMediaId,
    responses: input.responses,
    evaluationStatus: "NOT_REQUESTED",
    finishedAt: new Date()
  });

  if (env.enableEvaluationDispatch) {
    try {
      await evaluationClient.dispatchInterviewFinished({
        interviewId: id,
        userId: finished.userId
      });
      await interviewRepository.updateEvaluationStatus(id, "DISPATCHED");
      return {
        interviewId: finished.id,
        status: "FINISHED",
        evaluationStatus: "DISPATCHED"
      };
    } catch (error) {
      await interviewRepository.updateEvaluationStatus(id, "DISPATCH_FAILED");
      return {
        interviewId: finished.id,
        status: "FINISHED",
        evaluationStatus: "DISPATCH_FAILED"
      };
    }
  }

  return {
    interviewId: finished.id,
    status: finished.status,
    evaluationStatus: "NOT_REQUESTED"
  };
}

async function abandonInterview(id) {
  const interview = await interviewRepository.findById(id);

  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }

  if (interview.status === "FINISHED" || interview.status === "CANCELLED") {
    return {
      interviewId: interview.id,
      status: interview.status,
      evaluationStatus: interview.evaluationStatus
    };
  }

  if (interview.status !== "CREATED" && interview.status !== "IN_PROGRESS") {
    throw new ApiError(409, "Only active interviews can be closed");
  }

  const updated = await interviewRepository.markCancelled(id, new Date());
  return {
    interviewId: updated.id,
    status: updated.status,
    evaluationStatus: updated.evaluationStatus
  };
}

async function getEvaluationPayload(id) {
  const interview = await interviewRepository.findById(id);

  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }

  return {
    interviewId: interview.id,
    userId: interview.userId,
    candidateProfileId: interview.candidateProfileId,
    targetRole: interview.targetRole,
    level: interview.level,
    status: interview.status,
    videoMediaId: interview.videoMediaId,
    startedAt: interview.startedAt,
    finishedAt: interview.finishedAt,
    questions: interview.questions.map((question) => mapQuestion(question, true))
  };
}

module.exports = {
  createInterview,
  getInterview,
  listInterviewsByUserId,
  startInterview,
  finishInterview,
  abandonInterview,
  getEvaluationPayload
};
