-- CreateEnum
CREATE TYPE "CardLanguage" AS ENUM ('ru', 'en', 'uk');

-- AlterTable
ALTER TABLE "Card"
ADD COLUMN "language" "CardLanguage" NOT NULL DEFAULT 'ru';

-- AlterTable
ALTER TABLE "ExpiredCardToken"
ADD COLUMN "language" "CardLanguage" NOT NULL DEFAULT 'ru';
