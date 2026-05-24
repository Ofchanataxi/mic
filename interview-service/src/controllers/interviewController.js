const interviewService = require("../services/interviewService");
const { validateCreateInterview, validateFinishInterview } = require("../dto/interviewValidators");
const { asyncHandler } = require("../utils/asyncHandler");

const createInterview = asyncHandler(async (req, res) => {
  const input = validateCreateInterview(req.body || {});
  const result = await interviewService.createInterview(input);
  res.status(201).json(result);
});

const getInterview = asyncHandler(async (req, res) => {
  const result = await interviewService.getInterview(req.params.id);
  res.status(200).json(result);
});

const startInterview = asyncHandler(async (req, res) => {
  const result = await interviewService.startInterview(req.params.id);
  res.status(200).json(result);
});

const finishInterview = asyncHandler(async (req, res) => {
  const input = validateFinishInterview(req.body || {});
  const result = await interviewService.finishInterview(req.params.id, input);
  res.status(200).json(result);
});

const getEvaluationPayload = asyncHandler(async (req, res) => {
  const result = await interviewService.getEvaluationPayload(req.params.id);
  res.status(200).json(result);
});

module.exports = {
  createInterview,
  getInterview,
  startInterview,
  finishInterview,
  getEvaluationPayload
};
