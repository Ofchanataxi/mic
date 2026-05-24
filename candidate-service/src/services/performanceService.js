const { env } = require("../config/env");
const { candidateRepository } = require("../repositories/candidateRepository");
const { ApiError } = require("../utils/apiError");

class PerformanceService {
  async updatePerformance(userId, payload) {
    const profile = await candidateRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new ApiError(404, "Candidate profile not found");
    }

    try {
      const result = await candidateRepository.updatePerformance({
        profile,
        interviewId: payload.interviewId,
        results: payload.results,
        weakScoreThreshold: env.adaptiveWeakScoreThreshold
      });

      return {
        userId,
        candidateProfileId: profile.id,
        interviewId: payload.interviewId,
        updatedSubtopics: result.updatedSubtopics,
        updatedTopics: result.updatedTopics
      };
    } catch (error) {
      if (error.invalidIds) {
        throw new ApiError(400, error.message, { invalidIds: error.invalidIds });
      }

      throw error;
    }
  }
}

const performanceService = new PerformanceService();

module.exports = {
  performanceService
};
