const { candidateRepository } = require("../repositories/candidateRepository");
const { ApiError } = require("../utils/apiError");

class TopicsService {
  async getTopics(userId) {
    const profile = await candidateRepository.findTopicsByUserId(userId);

    if (!profile) {
      throw new ApiError(404, "Candidate profile not found");
    }

    return {
      userId: profile.userId,
      candidateProfileId: profile.id,
      topics: profile.topics
    };
  }
}

const topicsService = new TopicsService();

module.exports = {
  topicsService
};
