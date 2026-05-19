CREATE SCHEMA IF NOT EXISTS "feedback";

CREATE TYPE "feedback"."FeedbackJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "feedback"."FeedbackReportStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');
CREATE TYPE "feedback"."FeedbackSkillType" AS ENUM ('TECHNICAL', 'SOFT', 'CODE');

CREATE TABLE "feedback"."FeedbackJob" (
  "id" TEXT NOT NULL,
  "interviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "evaluationId" TEXT,
  "status" "feedback"."FeedbackJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedbackJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback"."FeedbackReport" (
  "id" TEXT NOT NULL,
  "feedbackJobId" TEXT NOT NULL,
  "interviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "evaluationId" TEXT,
  "status" "feedback"."FeedbackReportStatus" NOT NULL DEFAULT 'GENERATING',
  "overallScore" DOUBLE PRECISION,
  "technicalScore" DOUBLE PRECISION,
  "softSkillsScore" DOUBLE PRECISION,
  "codeScore" DOUBLE PRECISION,
  "audioScore" DOUBLE PRECISION,
  "videoScore" DOUBLE PRECISION,
  "executiveSummary" TEXT,
  "generalLevel" TEXT,
  "strengths" JSONB,
  "improvementAreas" JSONB,
  "recommendations" JSONB,
  "technicalFeedback" JSONB,
  "softSkillsFeedback" JSONB,
  "codeFeedback" JSONB,
  "audioFeedback" JSONB,
  "videoFeedback" JSONB,
  "multimodalObservations" JSONB,
  "questionFeedback" JSONB,
  "rawEvaluationData" JSONB,
  "generatedReport" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedbackReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback"."FeedbackQuestionDetail" (
  "id" TEXT NOT NULL,
  "feedbackReportId" TEXT NOT NULL,
  "interviewId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "order" INTEGER,
  "skillType" "feedback"."FeedbackSkillType" NOT NULL,
  "questionText" TEXT NOT NULL,
  "candidateSubtopicId" TEXT,
  "topicName" TEXT,
  "subtopicName" TEXT,
  "score" DOUBLE PRECISION,
  "summary" TEXT,
  "strengths" JSONB,
  "weaknesses" JSONB,
  "recommendations" JSONB,
  "semanticNotes" TEXT,
  "audioNotes" TEXT,
  "videoNotes" TEXT,
  "codeNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedbackQuestionDetail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeedbackJob_interviewId_key" ON "feedback"."FeedbackJob"("interviewId");
CREATE UNIQUE INDEX "FeedbackReport_feedbackJobId_key" ON "feedback"."FeedbackReport"("feedbackJobId");
CREATE UNIQUE INDEX "FeedbackReport_interviewId_key" ON "feedback"."FeedbackReport"("interviewId");
CREATE UNIQUE INDEX "FeedbackQuestionDetail_interviewId_questionId_key" ON "feedback"."FeedbackQuestionDetail"("interviewId", "questionId");

ALTER TABLE "feedback"."FeedbackReport"
  ADD CONSTRAINT "FeedbackReport_feedbackJobId_fkey"
  FOREIGN KEY ("feedbackJobId") REFERENCES "feedback"."FeedbackJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feedback"."FeedbackQuestionDetail"
  ADD CONSTRAINT "FeedbackQuestionDetail_feedbackReportId_fkey"
  FOREIGN KEY ("feedbackReportId") REFERENCES "feedback"."FeedbackReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
