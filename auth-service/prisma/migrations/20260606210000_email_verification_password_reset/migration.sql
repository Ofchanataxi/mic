CREATE TYPE "auth"."ActionTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

ALTER TABLE "auth"."User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

UPDATE "auth"."User"
SET "emailVerifiedAt" = CURRENT_TIMESTAMP
WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "auth"."ActionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "auth"."ActionTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActionToken_tokenHash_key" ON "auth"."ActionToken"("tokenHash");
CREATE INDEX "ActionToken_userId_type_idx" ON "auth"."ActionToken"("userId", "type");
CREATE INDEX "ActionToken_expiresAt_idx" ON "auth"."ActionToken"("expiresAt");

ALTER TABLE "auth"."ActionToken"
ADD CONSTRAINT "ActionToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "auth"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
