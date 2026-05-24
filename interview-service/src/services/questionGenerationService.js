const { env } = require("../config/env");
const interviewRepository = require("../repositories/interviewRepository");
const questionGenerationProvider = require("../providers/questionGenerationProvider");
const embeddingProvider = require("../providers/embeddingProvider");
const { cosineSimilarity } = require("../utils/cosineSimilarity");

function normalizeExpectedLevel(value) {
  return ["BASIC", "INTERMEDIATE", "ADVANCED"].includes(value) ? value : null;
}

function maxSimilarity(embedding, previousEmbeddings) {
  let max = 0;

  for (const previous of previousEmbeddings) {
    const previousVector = Array.isArray(previous.embedding)
      ? previous.embedding
      : previous.embedding?.data || previous.embedding;
    const score = cosineSimilarity(embedding, previousVector);
    if (score > max) {
      max = score;
    }
  }

  return max;
}

async function generateQuestionsForPlan({ userId, targetRole, level, evaluationPlan }) {
  const persistedEmbeddings = await interviewRepository.findPreviousEmbeddingsByUserId(userId);
  const acceptedEmbeddings = persistedEmbeddings.map((item) => ({
    embedding: item.embedding
  }));
  const generatedQuestions = [];

  for (let index = 0; index < evaluationPlan.length; index += 1) {
    const planItem = evaluationPlan[index];
    let bestCandidate = null;
    const attempts = [];

    for (let attemptNumber = 1; attemptNumber <= env.questionGenerationMaxAttempts; attemptNumber += 1) {
      const question = await questionGenerationProvider.generateQuestion({
        planItem,
        targetRole,
        level,
        attemptNumber
      });
      const { embedding, model } = await embeddingProvider.generateEmbedding(question.prompt);
      const similarityScore = maxSimilarity(embedding, acceptedEmbeddings);
      const accepted = similarityScore < env.questionSimilarityThreshold;

      const attemptRecord = {
        attemptNumber,
        prompt: question.prompt,
        similarityScore,
        accepted,
        rejectionReason: accepted ? null : "SIMILAR_TO_PREVIOUS_QUESTION"
      };
      attempts.push(attemptRecord);

      const candidate = {
        ...question,
        embedding,
        embeddingModel: model,
        similarityScore,
        attempts: [...attempts],
        generationAttempts: attemptNumber
      };

      if (!bestCandidate || similarityScore < bestCandidate.similarityScore) {
        bestCandidate = candidate;
      }

      if (accepted) {
        bestCandidate = candidate;
        break;
      }
    }

    if (!bestCandidate.attempts.some((attempt) => attempt.accepted)) {
      bestCandidate.attempts = bestCandidate.attempts.map((attempt) => ({
        ...attempt,
        accepted: attempt.prompt === bestCandidate.prompt,
        rejectionReason: attempt.prompt === bestCandidate.prompt ? null : attempt.rejectionReason
      }));
    }

    acceptedEmbeddings.push({
      embedding: bestCandidate.embedding
    });

    generatedQuestions.push({
      candidateTopicId: planItem.candidateTopicId,
      candidateSubtopicId: planItem.candidateSubtopicId,
      skillType: planItem.skillType,
      topic: planItem.topic,
      subtopic: planItem.subtopic,
      questionType: bestCandidate.questionType,
      prompt: bestCandidate.prompt,
      language: bestCandidate.language,
      orderIndex: index + 1,
      expectedLevel: normalizeExpectedLevel(planItem.expectedLevel),
      generatedByModel: bestCandidate.generatedByModel,
      generationAttempts: bestCandidate.generationAttempts,
      embedding: bestCandidate.embedding,
      embeddingModel: bestCandidate.embeddingModel,
      attempts: bestCandidate.attempts
    });
  }

  return generatedQuestions;
}

module.exports = {
  generateQuestionsForPlan
};
