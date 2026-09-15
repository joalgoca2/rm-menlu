-- AlterTable
ALTER TABLE "brand_customer_payments" ADD COLUMN     "student_id" TEXT;

-- CreateIndex
CREATE INDEX "brand_customer_payments_student_id_idx" ON "brand_customer_payments"("student_id");

-- AddForeignKey
ALTER TABLE "brand_customer_payments" ADD CONSTRAINT "brand_customer_payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
