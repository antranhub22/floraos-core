-- CreateEnum
CREATE TYPE "occasion_register" AS ENUM ('FESTIVE', 'NEUTRAL', 'SOLEMN');

-- AlterTable
ALTER TABLE "occasions" ADD COLUMN     "register" "occasion_register" NOT NULL DEFAULT 'FESTIVE';
