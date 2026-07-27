-- CreateTable
CREATE TABLE "ExpiredCardToken" (
    "token" VARCHAR(43) NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "retainedUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpiredCardToken_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE INDEX "ExpiredCardToken_retainedUntil_idx" ON "ExpiredCardToken"("retainedUntil");
