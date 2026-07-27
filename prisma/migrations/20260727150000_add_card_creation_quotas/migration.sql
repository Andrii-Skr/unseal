-- CreateTable
CREATE TABLE "CardCreationQuota" (
    "key" VARCHAR(80) NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardCreationQuota_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "CardCreationQuota_updatedAt_idx" ON "CardCreationQuota"("updatedAt");
