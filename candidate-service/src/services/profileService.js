const { env } = require("../config/env");
const { candidateRepository } = require("../repositories/candidateRepository");
const { mediaClient } = require("./mediaClient");
const { openAiProvider } = require("../providers/openaiProvider");
const { getSoftSkills } = require("./softSkillsCatalog");
const { ApiError } = require("../utils/apiError");
const { normalizeName } = require("../utils/normalize");
const { SkillType, TopicSource } = require("../utils/constants");

class ProfileService {
  async createProfileFromCv(payload) {
    const metadata = await mediaClient.getMediaMetadata(payload.mediaId);

    if (metadata.resourceType !== "PDF") {
      throw new ApiError(400, "mediaId must reference a PDF resource");
    }

    if (metadata.status !== "READY") {
      throw new ApiError(409, "PDF media is not ready yet");
    }

    const pdf = await mediaClient.downloadPdf(payload.mediaId);
    const structuredProfile = await openAiProvider.analyzeCvPdf({
      pdfBuffer: pdf.buffer,
      mediaId: payload.mediaId,
      targetRole: payload.targetRole,
      level: payload.level
    });

    const topics = [
      ...this.mapTechnicalTopics(structuredProfile.topics),
      ...this.mapSoftSkillTopics()
    ];

    const profile = await candidateRepository.replaceProfile({
      profileData: {
        userId: payload.userId,
        cvMediaId: payload.mediaId,
        fullName: structuredProfile.fullName,
        professionalSummary: structuredProfile.professionalSummary,
        estimatedSeniority: payload.level || structuredProfile.estimatedSeniority,
        targetRole: payload.targetRole || structuredProfile.suggestedTargetRoles[0] || null,
        yearsOfExperience: structuredProfile.yearsOfExperience,
        rawStructuredProfile: structuredProfile
      },
      topics
    });

    return profile;
  }

  async getProfile(userId) {
    const profile = await candidateRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new ApiError(404, "Candidate profile not found");
    }

    return profile;
  }

  mapTechnicalTopics(topics) {
    const seen = new Set();

    return topics
      .filter((topic) => topic && topic.name)
      .map((topic) => {
        const normalizedName = normalizeName(topic.name);

        if (seen.has(normalizedName)) {
          return null;
        }

        seen.add(normalizedName);

        return {
          name: topic.name.trim(),
          normalizedName,
          skillType: SkillType.TECHNICAL,
          category: topic.category,
          expectedLevel: topic.expectedLevel,
          source: topic.source || TopicSource.LLM_INFERRED,
          priority: Number.isInteger(topic.priority) ? topic.priority : 50,
          subtopics: this.mapTechnicalSubtopics(topic.subtopics || [])
        };
      })
      .filter((topic) => topic && topic.subtopics.length > 0);
  }

  mapTechnicalSubtopics(subtopics) {
    const seen = new Set();

    return subtopics
      .filter((subtopic) => subtopic && subtopic.name)
      .map((subtopic) => {
        const normalizedName = normalizeName(subtopic.name);

        if (seen.has(normalizedName)) {
          return null;
        }

        seen.add(normalizedName);

        return {
          name: subtopic.name.trim(),
          normalizedName,
          skillType: SkillType.TECHNICAL,
          expectedLevel: subtopic.expectedLevel,
          source: subtopic.source || TopicSource.LLM_INFERRED,
          priority: Number.isInteger(subtopic.priority) ? subtopic.priority : 50
        };
      })
      .filter(Boolean);
  }

  mapSoftSkillTopics() {
    return getSoftSkills(env.softSkillsLimit).map((topic) => ({
      name: topic.name,
      normalizedName: normalizeName(topic.name),
      skillType: SkillType.SOFT,
      category: topic.category,
      expectedLevel: topic.expectedLevel,
      source: topic.source,
      priority: topic.priority,
      subtopics: topic.subtopics.map((subtopicName) => ({
        name: subtopicName,
        normalizedName: normalizeName(subtopicName),
        skillType: SkillType.SOFT,
        expectedLevel: topic.expectedLevel,
        source: topic.source,
        priority: topic.priority
      }))
    }));
  }
}

const profileService = new ProfileService();

module.exports = {
  profileService
};
