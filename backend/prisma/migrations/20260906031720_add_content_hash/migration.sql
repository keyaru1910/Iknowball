-- AlterTable
ALTER TABLE "League" ADD COLUMN     "contentHash" VARCHAR(64);

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "contentHash" VARCHAR(64);

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "contentHash" VARCHAR(64);
