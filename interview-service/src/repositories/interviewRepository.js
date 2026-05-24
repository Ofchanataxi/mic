const { prisma } = require("../config/prisma");

function includeInterviewDetails() {
  return {
    questions: {
      orderBy: { orderIndex: "asc" },
      include: {
        response: true,
        codeSubmission: true
      }
    }
  };
}

async function createInterviewWithQuestions({ interview, questions }) {
  return prisma.$transaction(async (tx) => {
    const createdInterview = await tx.interview.create({
      data: {
        ...interview,
        questions: {
          create: questions.map((question) => ({
            candidateTopicId: question.candidateTopicId,
            candidateSubtopicId: question.candidateSubtopicId,
            skillType: question.skillType,
            topic: question.topic,
            subtopic: question.subtopic,
            questionType: question.questionType,
            prompt: question.prompt,
            language: question.language,
            orderIndex: question.orderIndex,
            expectedLevel: question.expectedLevel,
            generatedByModel: question.generatedByModel,
            generationAttempts: question.generationAttempts
          }))
        }
      },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" }
        }
      }
    });

    const questionByOrderIndex = new Map(
      createdInterview.questions.map((question) => [question.orderIndex, question])
    );

    for (const question of questions) {
      const createdQuestion = questionByOrderIndex.get(question.orderIndex);

      for (const attempt of question.attempts) {
        await tx.questionGenerationAttempt.create({
          data: {
            interviewId: createdInterview.id,
            candidateSubtopicId: question.candidateSubtopicId,
            attemptNumber: attempt.attemptNumber,
            prompt: attempt.prompt,
            similarityScore: attempt.similarityScore,
            accepted: attempt.accepted,
            rejectionReason: attempt.rejectionReason
          }
        });
      }

      await tx.questionEmbedding.create({
        data: {
          userId: interview.userId,
          interviewQuestionId: createdQuestion.id,
          prompt: question.prompt,
          embedding: question.embedding,
          model: question.embeddingModel
        }
      });
    }

    return tx.interview.findUnique({
      where: { id: createdInterview.id },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" }
        }
      }
    });
  });
}

async function findById(id) {
  return prisma.interview.findUnique({
    where: { id },
    include: includeInterviewDetails()
  });
}

async function findPreviousEmbeddingsByUserId(userId) {
  return prisma.questionEmbedding.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

async function markStarted(id, startedAt) {
  return prisma.interview.update({
    where: { id },
    data: {
      status: "IN_PROGRESS",
      startedAt
    }
  });
}

async function finishInterview({ id, videoMediaId, responses, evaluationStatus, finishedAt }) {
  return prisma.$transaction(async (tx) => {
    await tx.interviewResponse.deleteMany({
      where: { interviewId: id }
    });
    await tx.interviewCodeSubmission.deleteMany({
      where: { interviewId: id }
    });

    for (const response of responses) {
      await tx.interviewResponse.create({
        data: {
          interviewId: id,
          questionId: response.questionId,
          answerText: response.answerText,
          videoStartMs: response.videoStartMs,
          videoEndMs: response.videoEndMs,
          answerStartedAt: response.answerStartedAt,
          answerEndedAt: response.answerEndedAt
        }
      });

      if (response.codeSubmission) {
        await tx.interviewCodeSubmission.create({
          data: {
            interviewId: id,
            questionId: response.questionId,
            language: response.codeSubmission.language,
            code: response.codeSubmission.code
          }
        });
      }
    }

    return tx.interview.update({
      where: { id },
      data: {
        status: "FINISHED",
        evaluationStatus,
        videoMediaId,
        finishedAt
      },
      include: includeInterviewDetails()
    });
  });
}

async function updateEvaluationStatus(id, evaluationStatus) {
  return prisma.interview.update({
    where: { id },
    data: { evaluationStatus }
  });
}

module.exports = {
  createInterviewWithQuestions,
  findById,
  findPreviousEmbeddingsByUserId,
  markStarted,
  finishInterview,
  updateEvaluationStatus
};
