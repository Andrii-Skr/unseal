-- CreateTable
CREATE TABLE "Card" (
    "id" UUID NOT NULL,
    "token" VARCHAR(43) NOT NULL,
    "senderName" VARCHAR(80) NOT NULL,
    "recipientName" VARCHAR(80) NOT NULL,
    "introPhrase" TEXT NOT NULL,
    "intermediatePhrases" TEXT[],
    "preHeartPhrase" TEXT NOT NULL,
    "finalMessage" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "replyUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_token_key" ON "Card"("token");

-- CreateIndex
CREATE INDEX "Card_expiresAt_idx" ON "Card"("expiresAt");
