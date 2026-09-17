-- AlterTable
ALTER TABLE "physical_challenges" ADD COLUMN     "metric_type" TEXT NOT NULL DEFAULT 'REPETITIONS',
ADD COLUMN     "requires_validation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "target_reps" INTEGER NOT NULL DEFAULT 10;
