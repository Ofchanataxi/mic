CREATE SCHEMA IF NOT EXISTS "candidate";

CREATE TYPE "candidate"."SkillType" AS ENUM ('TECHNICAL', 'SOFT');
CREATE TYPE "candidate"."ExpectedLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE "candidate"."TopicSource" AS ENUM ('CV_EXPLICIT', 'LLM_INFERRED', 'SYSTEM_DEFAULT');
CREATE TYPE "candidate"."SeniorityLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR');

CREATE TABLE "candidate"."candidate_profiles" (
  "id" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  "cvMediaId" TEXT NOT NULL,
  "fullName" TEXT,
  "professionalSummary" TEXT,
  "estimatedSeniority" "candidate"."SeniorityLevel",
  "targetRole" TEXT,
  "yearsOfExperience" DOUBLE PRECISION,
  "rawStructuredProfile" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "candidate"."candidate_topics" (
  "id" UUID NOT NULL,
  "candidateProfileId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "skillType" "candidate"."SkillType" NOT NULL,
  "category" TEXT,
  "expectedLevel" "candidate"."ExpectedLevel",
  "source" "candidate"."TopicSource" NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "averageScore" DOUBLE PRECISION,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "lastEvaluatedAt" TIMESTAMP(3),
  "reinforce" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "candidate_topics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "candidate"."candidate_subtopics" (
  "id" UUID NOT NULL,
  "candidateProfileId" UUID NOT NULL,
  "candidateTopicId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "skillType" "candidate"."SkillType" NOT NULL,
  "expectedLevel" "candidate"."ExpectedLevel",
  "source" "candidate"."TopicSource" NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "averageScore" DOUBLE PRECISION,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "lastEvaluatedAt" TIMESTAMP(3),
  "reinforce" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "candidate_subtopics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "candidate"."candidate_subtopic_performances" (
  "id" UUID NOT NULL,
  "candidateProfileId" UUID NOT NULL,
  "candidateSubtopicId" UUID NOT NULL,
  "interviewId" TEXT NOT NULL,
  "questionId" TEXT,
  "score" DOUBLE PRECISION NOT NULL,
  "evaluationType" TEXT,
  "feedback" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "candidate_subtopic_performances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "candidate_profiles_userId_key" ON "candidate"."candidate_profiles"("userId");
CREATE INDEX "candidate_topics_candidateProfileId_idx" ON "candidate"."candidate_topics"("candidateProfileId");
CREATE INDEX "candidate_topics_skillType_idx" ON "candidate"."candidate_topics"("skillType");
CREATE UNIQUE INDEX "candidate_topics_candidateProfileId_normalizedName_skillType_key" ON "candidate"."candidate_topics"("candidateProfileId", "normalizedName", "skillType");
CREATE INDEX "candidate_subtopics_candidateProfileId_idx" ON "candidate"."candidate_subtopics"("candidateProfileId");
CREATE INDEX "candidate_subtopics_candidateTopicId_idx" ON "candidate"."candidate_subtopics"("candidateTopicId");
CREATE INDEX "candidate_subtopics_skillType_idx" ON "candidate"."candidate_subtopics"("skillType");
CREATE UNIQUE INDEX "candidate_subtopics_candidateTopicId_normalizedName_key" ON "candidate"."candidate_subtopics"("candidateTopicId", "normalizedName");
CREATE INDEX "candidate_subtopic_performances_candidateProfileId_idx" ON "candidate"."candidate_subtopic_performances"("candidateProfileId");
CREATE INDEX "candidate_subtopic_performances_candidateSubtopicId_idx" ON "candidate"."candidate_subtopic_performances"("candidateSubtopicId");
CREATE INDEX "candidate_subtopic_performances_interviewId_idx" ON "candidate"."candidate_subtopic_performances"("interviewId");

ALTER TABLE "candidate"."candidate_topics"
  ADD CONSTRAINT "candidate_topics_candidateProfileId_fkey"
  FOREIGN KEY ("candidateProfileId") REFERENCES "candidate"."candidate_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "candidate"."candidate_subtopics"
  ADD CONSTRAINT "candidate_subtopics_candidateProfileId_fkey"
  FOREIGN KEY ("candidateProfileId") REFERENCES "candidate"."candidate_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "candidate"."candidate_subtopics"
  ADD CONSTRAINT "candidate_subtopics_candidateTopicId_fkey"
  FOREIGN KEY ("candidateTopicId") REFERENCES "candidate"."candidate_topics"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "candidate"."candidate_subtopic_performances"
  ADD CONSTRAINT "candidate_subtopic_performances_candidateProfileId_fkey"
  FOREIGN KEY ("candidateProfileId") REFERENCES "candidate"."candidate_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "candidate"."candidate_subtopic_performances"
  ADD CONSTRAINT "candidate_subtopic_performances_candidateSubtopicId_fkey"
  FOREIGN KEY ("candidateSubtopicId") REFERENCES "candidate"."candidate_subtopics"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
