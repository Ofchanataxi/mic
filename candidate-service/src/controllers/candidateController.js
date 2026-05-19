const {
  validateCreateProfileFromCv,
  validateAdaptiveStrategyQuery,
  validatePerformancePayload
} = require("../dto/candidateValidators");
const { profileService } = require("../services/profileService");
const { topicsService } = require("../services/topicsService");
const { adaptiveStrategyService } = require("../services/adaptiveStrategyService");
const { performanceService } = require("../services/performanceService");

async function createProfileFromCv(req, res, next) {
  try {
    const payload = validateCreateProfileFromCv(req.body);
    const profile = await profileService.createProfileFromCv(payload);
    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.params.userId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

async function getTopics(req, res, next) {
  try {
    const result = await topicsService.getTopics(req.params.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAdaptiveStrategy(req, res, next) {
  try {
    const query = validateAdaptiveStrategyQuery(req.query);
    const result = await adaptiveStrategyService.generateStrategy({
      userId: req.params.userId,
      ...query
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function updatePerformance(req, res, next) {
  try {
    const payload = validatePerformancePayload(req.body);
    const result = await performanceService.updatePerformance(req.params.userId, payload);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProfileFromCv,
  getProfile,
  getTopics,
  getAdaptiveStrategy,
  updatePerformance
};
