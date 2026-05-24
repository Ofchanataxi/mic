CREATE SCHEMA IF NOT EXISTS "auth";

CREATE TYPE "auth"."UserRole" AS ENUM ('CANDIDATE', 'ADMIN');
CREATE TYPE "auth"."UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

CREATE TABLE "auth"."User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "role" "auth"."UserRole" NOT NULL DEFAULT 'CANDIDATE',
  "status" "auth"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth"."RefreshToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "replacedByTokenId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "auth"."User"("email");
CREATE INDEX "RefreshToken_userId_idx" ON "auth"."RefreshToken"("userId");
CREATE INDEX "RefreshToken_tokenHash_idx" ON "auth"."RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "auth"."RefreshToken"("expiresAt");

ALTER TABLE "auth"."RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
