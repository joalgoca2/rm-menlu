/*
  Warnings:

  - You are about to drop the column `metric_type` on the `physical_challenges` table. All the data in the column will be lost.
  - You are about to drop the column `requires_validation` on the `physical_challenges` table. All the data in the column will be lost.
  - You are about to drop the column `target_reps` on the `physical_challenges` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[brand_id,type]` on the table `diploma_configs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "diploma_configs_brand_id_key";

-- AlterTable
ALTER TABLE "brand_customer_payments" ADD COLUMN     "external_payer_name" TEXT,
ADD COLUMN     "tournament_id" TEXT;

-- AlterTable
ALTER TABLE "diploma_configs" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'EXAM';

-- AlterTable
ALTER TABLE "physical_challenges" DROP COLUMN "metric_type",
DROP COLUMN "requires_validation",
DROP COLUMN "target_reps",
ALTER COLUMN "xp_reward" SET DEFAULT 50;

-- CreateTable
CREATE TABLE "tournament_participants" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "student_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "age" INTEGER,
    "gender" TEXT DEFAULT 'MIXED',
    "weight_kg" DOUBLE PRECISION,
    "actual_weight_kg" DOUBLE PRECISION,
    "dojo_name" TEXT,
    "belt_name" TEXT,
    "emergency_contact" TEXT,
    "is_external" BOOLEAN NOT NULL DEFAULT false,
    "is_checked_in" BOOLEAN NOT NULL DEFAULT false,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "fee_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_id" TEXT,
    "category_id" TEXT,
    "award_rank" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_participants_tournament_id_idx" ON "tournament_participants"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_participants_student_id_idx" ON "tournament_participants"("student_id");

-- CreateIndex
CREATE INDEX "tournament_participants_category_id_idx" ON "tournament_participants"("category_id");

-- CreateIndex
CREATE INDEX "tournament_participants_payment_status_idx" ON "tournament_participants"("payment_status");

-- CreateIndex
CREATE INDEX "brand_customer_payments_tournament_id_idx" ON "brand_customer_payments"("tournament_id");

-- CreateIndex
CREATE UNIQUE INDEX "diploma_configs_brand_id_type_key" ON "diploma_configs"("brand_id", "type");

-- AddForeignKey
ALTER TABLE "brand_customer_payments" ADD CONSTRAINT "brand_customer_payments_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "brand_customer_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tournament_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
