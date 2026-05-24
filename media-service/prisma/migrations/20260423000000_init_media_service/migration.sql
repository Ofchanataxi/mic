CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "ResourceType" AS ENUM ('VIDEO', 'PDF');
CREATE TYPE "MediaStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'FAILED');

CREATE TABLE "media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resourceType" "ResourceType" NOT NULL,
    "interviewId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT,
    "bucketName" TEXT,
    "sizeBytes" BIGINT NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOADED',
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "media_interviewId_idx" ON "media"("interviewId");
CREATE INDEX "media_ownerId_idx" ON "media"("ownerId");
CREATE INDEX "media_status_idx" ON "media"("status");
