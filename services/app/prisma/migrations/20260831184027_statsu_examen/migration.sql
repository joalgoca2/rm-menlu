-- AlterTable
ALTER TABLE "brands" ALTER COLUMN "currency" SET DEFAULT 'MXN';

-- AlterTable
ALTER TABLE "grade_exams" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PLANNED';
