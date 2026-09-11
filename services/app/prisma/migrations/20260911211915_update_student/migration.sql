-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;
