const { prisma } = require("../config/prisma");

class CandidateRepository {
  async replaceProfile({ profileData, topics }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.candidateProfile.findUnique({
        where: { userId: profileData.userId }
      });

      if (existing) {
        await tx.candidateProfile.delete({
          where: { id: existing.id }
        });
      }

      const profile = await tx.candidateProfile.create({
        data: profileData
      });

      for (const topic of topics) {
        const createdTopic = await tx.candidateTopic.create({
          data: {
            candidateProfileId: profile.id,
            name: topic.name,
            normalizedName: topic.normalizedName,
            skillType: topic.skillType,
            category: topic.category,
            expectedLevel: topic.expectedLevel,
            source: topic.source,
            priority: topic.priority
          }
        });

        for (const subtopic of topic.subtopics) {
          await tx.candidateSubtopic.create({
            data: {
              candidateProfileId: profile.id,
              candidateTopicId: createdTopic.id,
              name: subtopic.name,
              normalizedName: subtopic.normalizedName,
              skillType: subtopic.skillType,
              expectedLevel: subtopic.expectedLevel,
              source: subtopic.source,
              priority: subtopic.priority
            }
          });
        }
      }

      return tx.candidateProfile.findUnique({
        where: { id: profile.id },
        include: this.profileIncludes()
      });
    });
  }

  async findProfileByUserId(userId) {
    return prisma.candidateProfile.findUnique({
      where: { userId },
      include: this.profileIncludes()
    });
  }

  async findTopicsByUserId(userId) {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        topics: {
          orderBy: [{ skillType: "asc" }, { priority: "desc" }, { name: "asc" }],
          include: {
            subtopics: {
              orderBy: [{ priority: "desc" }, { name: "asc" }]
            }
          }
        }
      }
    });

    return profile;
  }

  async findSubtopicsForStrategy(userId) {
    return prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        subtopics: {
          include: {
            candidateTopic: true
          },
          orderBy: [
            { usageCount: "asc" },
            { reinforce: "desc" },
            { priority: "desc" },
            { name: "asc" }
          ]
        }
      }
    });
  }

  async updatePerformance({ profile, interviewId, results, weakScoreThreshold }) {
    return prisma.$transaction(async (tx) => {
      const subtopicIds = results.map((result) => result.candidateSubtopicId);
      const subtopics = await tx.candidateSubtopic.findMany({
        where: {
          id: { in: subtopicIds },
          candidateProfileId: profile.id
        }
      });

      const validIds = new Set(subtopics.map((subtopic) => subtopic.id));
      const invalidIds = subtopicIds.filter((id) => !validIds.has(id));

      if (invalidIds.length > 0) {
        const error = new Error("Some candidateSubtopicId values do not belong to this candidate profile");
        error.invalidIds = invalidIds;
        throw error;
      }

      for (const result of results) {
        await tx.candidateSubtopicPerformance.create({
          data: {
            candidateProfileId: profile.id,
            candidateSubtopicId: result.candidateSubtopicId,
            interviewId,
            questionId: result.questionId,
            score: result.score,
            evaluationType: result.evaluationType,
            feedback: result.feedback
          }
        });
      }

      const touchedTopicIds = new Set();
      const updatedSubtopics = [];

      for (const subtopic of subtopics) {
        touchedTopicIds.add(subtopic.candidateTopicId);
        const aggregate = await tx.candidateSubtopicPerformance.aggregate({
          where: { candidateSubtopicId: subtopic.id },
          _avg: { score: true },
          _count: { score: true }
        });

        updatedSubtopics.push(await tx.candidateSubtopic.update({
          where: { id: subtopic.id },
          data: {
            averageScore: aggregate._avg.score,
            usageCount: aggregate._count.score,
            lastEvaluatedAt: new Date(),
            reinforce: aggregate._avg.score !== null && aggregate._avg.score < weakScoreThreshold
          }
        }));
      }

      const updatedTopics = [];

      for (const topicId of touchedTopicIds) {
        const aggregate = await tx.candidateSubtopic.aggregate({
          where: {
            candidateTopicId: topicId,
            averageScore: { not: null }
          },
          _avg: { averageScore: true },
          _sum: { usageCount: true },
          _max: { lastEvaluatedAt: true }
        });

        updatedTopics.push(await tx.candidateTopic.update({
          where: { id: topicId },
          data: {
            averageScore: aggregate._avg.averageScore,
            usageCount: aggregate._sum.usageCount || 0,
            lastEvaluatedAt: aggregate._max.lastEvaluatedAt,
            reinforce: aggregate._avg.averageScore !== null && aggregate._avg.averageScore < weakScoreThreshold
          }
        }));
      }

      return {
        updatedSubtopics,
        updatedTopics
      };
    });
  }

  profileIncludes() {
    return {
      topics: {
        orderBy: [{ skillType: "asc" }, { priority: "desc" }, { name: "asc" }],
        include: {
          subtopics: {
            orderBy: [{ priority: "desc" }, { name: "asc" }]
          }
        }
      }
    };
  }
}

const candidateRepository = new CandidateRepository();

module.exports = {
  candidateRepository
};
