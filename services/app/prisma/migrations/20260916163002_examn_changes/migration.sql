-- AlterTable
ALTER TABLE "grade_exams" ADD COLUMN     "max_belt_id" TEXT,
ADD COLUMN     "min_belt_id" TEXT;

-- AddForeignKey
ALTER TABLE "grade_exams" ADD CONSTRAINT "grade_exams_min_belt_id_fkey" FOREIGN KEY ("min_belt_id") REFERENCES "belts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_exams" ADD CONSTRAINT "grade_exams_max_belt_id_fkey" FOREIGN KEY ("max_belt_id") REFERENCES "belts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
