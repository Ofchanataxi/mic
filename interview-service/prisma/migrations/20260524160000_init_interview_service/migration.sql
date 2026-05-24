CREATE SCHEMA IF NOT EXISTS "interview";

CREATE TYPE "interview"."InterviewStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');
CREATE TYPE "interview"."EvaluationDispatchStatus" AS ENUM ('NOT_REQUESTED', 'DISPATCHED', 'DISPATCH_FAILED');
CREATE TYPE "interview"."QuestionType" AS ENUM ('TECHNICAL', 'SOFT_SKILL', 'CODING');
CREATE TYPE "interview"."SkillType" AS ENUM ('TECHNICAL', 'SOFT');
CREATE TYPE "interview"."ExpectedLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE "interview"."SeniorityLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR');

CREATE TABLE "interview"."interviews" (
  "id" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "targetRole" TEXT,
  "level" "interview"."SeniorityLevel",
  "status" "interview"."InterviewStatus" NOT NULL DEFAULT 'CREATED',
  "evaluationStatus" "interview"."EvaluationDispatchStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "questionCount" INTEGER NOT NULL,
  "videoMediaId" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview"."interview_questions" (
  "id" UUID NOT NULL,
  "interviewId" UUID NOT NULL,
  "candidateTopicId" TEXT NOT NULL,
  "candidateSubtopicId" TEXT NOT NULL,
  "skillType" "interview"."SkillType" NOT NULL,
  "topic" TEXT NOT NULL,
  "subtopic" TEXT NOT NULL,
  "questionType" "interview"."QuestionType" NOT NULL,
  "prompt" TEXT NOT NULL,
  "language" TEXT,
  "orderIndex" INTEGER NOT NULL,
  "expectedLevel" "interview"."ExpectedLevel",
  "generatedByModel" TEXT,
  "generationAttempts" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview"."interview_responses" (
  "id" UUID NOT NULL,
  "interviewId" UUID NOT NULL,
  "questionId" UUID NOT NULL,
  "answerText" TEXT,
  "videoStartMs" INTEGER NOT NULL,
  "videoEndMs" INTEGER NOT NULL,
  "answerStartedAt" TIMESTAMP(3),
  "answerEndedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "interview_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview"."interview_code_submissions" (
  "id" UUID NOT NULL,
  "interviewId" UUID NOT NULL,
  "questionId" UUID NOT NULL,
  "language" TEXT,
  "code" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "interview_code_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview"."question_embeddings" (
  "id" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  "interviewQuestionId" UUID NOT NULL,
  "prompt" TEXT NOT NULL,
  "embedding" JSONB NOT NULL,
  "model" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "question_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview"."question_generation_attempts" (
  "id" UUID NOT NULL,
  "interviewId" UUID NOT NULL,
  "candidateSubtopicId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "prompt" TEXT NOT NULL,
  "similarityScore" DOUBLE PRECISION,
  "accepted" BOOLEAN NOT NULL,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "question_generation_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "interviews_userId_idx" ON "interview"."interviews"("userId");
CREATE INDEX "interviews_candidateProfileId_idx" ON "interview"."interviews"("candidateProfileId");
CREATE INDEX "interviews_status_idx" ON "interview"."interviews"("status");
CREATE INDEX "interview_questions_interviewId_idx" ON "interview"."interview_questions"("interviewId");
CREATE INDEX "interview_questions_candidateSubtopicId_idx" ON "interview"."interview_questions"("candidateSubtopicId");
CREATE UNIQUE INDEX "interview_questions_interviewId_orderIndex_key" ON "interview"."interview_questions"("interviewId", "orderIndex");
CREATE INDEX "interview_responses_interviewId_idx" ON "interview"."interview_responses"("interviewId");
CREATE UNIQUE INDEX "interview_responses_questionId_key" ON "interview"."interview_responses"("questionId");
CREATE INDEX "interview_code_submissions_interviewId_idx" ON "interview"."interview_code_submissions"("interviewId");
CREATE UNIQUE INDEX "interview_code_submissions_questionId_key" ON "interview"."interview_code_submissions"("questionId");
CREATE INDEX "question_embeddings_userId_idx" ON "interview"."question_embeddings"("userId");
CREATE UNIQUE INDEX "question_embeddings_interviewQuestionId_key" ON "interview"."question_embeddings"("interviewQuestionId");
CREATE INDEX "question_generation_attempts_interviewId_idx" ON "interview"."question_generation_attempts"("interviewId");
CREATE INDEX "question_generation_attempts_candidateSubtopicId_idx" ON "interview"."question_generation_attempts"("candidateSubtopicId");

ALTER TABLE "interview"."interview_questions"
  ADD CONSTRAINT "interview_questions_interviewId_fkey"
  FOREIGN KEY ("interviewId") REFERENCES "interview"."interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interview"."interview_responses"
  ADD CONSTRAINT "interview_responses_interviewId_fkey"
  FOREIGN KEY ("interviewId") REFERENCES "interview"."interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interview"."interview_responses"
  ADD CONSTRAINT "interview_responses_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "interview"."interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interview"."interview_code_submissions"
  ADD CONSTRAINT "interview_code_submissions_interviewId_fkey"
  FOREIGN KEY ("interviewId") REFERENCES "interview"."interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interview"."interview_code_submissions"
  ADD CONSTRAINT "interview_code_submissions_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "interview"."interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interview"."question_embeddings"
  ADD CONSTRAINT "question_embeddings_interviewQuestionId_fkey"
  FOREIGN KEY ("interviewQuestionId") REFERENCES "interview"."interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interview"."question_generation_attempts"
  ADD CONSTRAINT "question_generation_attempts_interviewId_fkey"
  FOREIGN KEY ("interviewId") REFERENCES "interview"."interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
