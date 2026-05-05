CREATE SCHEMA IF NOT EXISTS "evaluation";

CREATE TYPE "evaluation"."EvaluationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "evaluation"."InterviewEvaluationStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');
CREATE TYPE "evaluation"."QuestionEvaluationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');
CREATE TYPE "evaluation"."SkillType" AS ENUM ('TECHNICAL', 'SOFT', 'CODE');

CREATE TABLE "evaluation"."EvaluationJob" (
  "id" TEXT NOT NULL,
  "interviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "evaluation"."EvaluationJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EvaluationJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluation"."InterviewEvaluation" (
  "id" TEXT NOT NULL,
  "evaluationJobId" TEXT NOT NULL,
  "interviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "evaluation"."InterviewEvaluationStatus" NOT NULL DEFAULT 'PROCESSING',
  "overallScore" DOUBLE PRECISION,
  "technicalScore" DOUBLE PRECISION,
  "softSkillsScore" DOUBLE PRECISION,
  "codeScore" DOUBLE PRECISION,
  "audioScore" DOUBLE PRECISION,
  "videoScore" DOUBLE PRECISION,
  "semanticScore" DOUBLE PRECISION,
  "totalQuestions" INTEGER NOT NULL DEFAULT 0,
  "evaluatedQuestions" INTEGER NOT NULL DEFAULT 0,
  "failedQuestions" INTEGER NOT NULL DEFAULT 0,
  "summary" JSONB,
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterviewEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluation"."QuestionEvaluation" (
  "id" TEXT NOT NULL,
  "interviewEvaluationId" TEXT NOT NULL,
  "interviewId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "order" INTEGER,
  "candidateTopicId" TEXT,
  "candidateSubtopicId" TEXT,
  "skillType" "evaluation"."SkillType" NOT NULL,
  "status" "evaluation"."QuestionEvaluationStatus" NOT NULL DEFAULT 'PENDING',
  "questionText" TEXT NOT NULL,
  "answerText" TEXT,
  "transcription" TEXT,
  "codeSubmission" JSONB,
  "startTimeMs" INTEGER,
  "endTimeMs" INTEGER,
  "durationMs" INTEGER,
  "semanticScore" DOUBLE PRECISION,
  "audioScore" DOUBLE PRECISION,
  "videoScore" DOUBLE PRECISION,
  "codeScore" DOUBLE PRECISION,
  "finalScore" DOUBLE PRECISION,
  "strengths" JSONB,
  "weaknesses" JSONB,
  "recommendations" JSONB,
  "errorMessage" TEXT,
  "rawSemanticEvaluation" JSONB,
  "rawAudioAnalysis" JSONB,
  "rawVideoAnalysis" JSONB,
  "rawCodeEvaluation" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuestionEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluation"."AudioAnalysisResult" (
  "id" TEXT NOT NULL,
  "questionEvaluationId" TEXT NOT NULL,
  "durationMs" INTEGER,
  "wordCount" INTEGER,
  "speechRate" DOUBLE PRECISION,
  "pauseCount" INTEGER,
  "averagePauseMs" DOUBLE PRECISION,
  "fluencyScore" DOUBLE PRECISION,
  "confidenceIndicators" JSONB,
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AudioAnalysisResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluation"."VideoAnalysisResult" (
  "id" TEXT NOT NULL,
  "questionEvaluationId" TEXT NOT NULL,
  "eyeContactScore" DOUBLE PRECISION,
  "postureScore" DOUBLE PRECISION,
  "attentionScore" DOUBLE PRECISION,
  "observableBehavior" JSONB,
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VideoAnalysisResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluation"."SemanticEvaluationResult" (
  "id" TEXT NOT NULL,
  "questionEvaluationId" TEXT NOT NULL,
  "coherenceScore" DOUBLE PRECISION,
  "technicalAccuracyScore" DOUBLE PRECISION,
  "clarityScore" DOUBLE PRECISION,
  "depthScore" DOUBLE PRECISION,
  "relevanceScore" DOUBLE PRECISION,
  "overallSemanticScore" DOUBLE PRECISION,
  "justification" TEXT,
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SemanticEvaluationResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluation"."CodeEvaluationResult" (
  "id" TEXT NOT NULL,
  "questionEvaluationId" TEXT NOT NULL,
  "passedTests" INTEGER,
  "totalTests" INTEGER,
  "executionScore" DOUBLE PRECISION,
  "compilationStatus" TEXT,
  "runtimeError" TEXT,
  "simulated" BOOLEAN NOT NULL DEFAULT true,
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CodeEvaluationResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EvaluationJob_interviewId_key" ON "evaluation"."EvaluationJob"("interviewId");
CREATE UNIQUE INDEX "InterviewEvaluation_evaluationJobId_key" ON "evaluation"."InterviewEvaluation"("evaluationJobId");
CREATE UNIQUE INDEX "InterviewEvaluation_interviewId_key" ON "evaluation"."InterviewEvaluation"("interviewId");
CREATE UNIQUE INDEX "QuestionEvaluation_interviewId_questionId_key" ON "evaluation"."QuestionEvaluation"("interviewId", "questionId");
CREATE UNIQUE INDEX "AudioAnalysisResult_questionEvaluationId_key" ON "evaluation"."AudioAnalysisResult"("questionEvaluationId");
CREATE UNIQUE INDEX "VideoAnalysisResult_questionEvaluationId_key" ON "evaluation"."VideoAnalysisResult"("questionEvaluationId");
CREATE UNIQUE INDEX "SemanticEvaluationResult_questionEvaluationId_key" ON "evaluation"."SemanticEvaluationResult"("questionEvaluationId");
CREATE UNIQUE INDEX "CodeEvaluationResult_questionEvaluationId_key" ON "evaluation"."CodeEvaluationResult"("questionEvaluationId");

ALTER TABLE "evaluation"."InterviewEvaluation"
  ADD CONSTRAINT "InterviewEvaluation_evaluationJobId_fkey"
  FOREIGN KEY ("evaluationJobId") REFERENCES "evaluation"."EvaluationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evaluation"."QuestionEvaluation"
  ADD CONSTRAINT "QuestionEvaluation_interviewEvaluationId_fkey"
  FOREIGN KEY ("interviewEvaluationId") REFERENCES "evaluation"."InterviewEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evaluation"."AudioAnalysisResult"
  ADD CONSTRAINT "AudioAnalysisResult_questionEvaluationId_fkey"
  FOREIGN KEY ("questionEvaluationId") REFERENCES "evaluation"."QuestionEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evaluation"."VideoAnalysisResult"
  ADD CONSTRAINT "VideoAnalysisResult_questionEvaluationId_fkey"
  FOREIGN KEY ("questionEvaluationId") REFERENCES "evaluation"."QuestionEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evaluation"."SemanticEvaluationResult"
  ADD CONSTRAINT "SemanticEvaluationResult_questionEvaluationId_fkey"
  FOREIGN KEY ("questionEvaluationId") REFERENCES "evaluation"."QuestionEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evaluation"."CodeEvaluationResult"
  ADD CONSTRAINT "CodeEvaluationResult_questionEvaluationId_fkey"
  FOREIGN KEY ("questionEvaluationId") REFERENCES "evaluation"."QuestionEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
