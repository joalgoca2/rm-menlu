/*
  Warnings:

  - The `status` column on the `brand_customer_payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `payment_transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BrandPaymentStatus" AS ENUM ('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SaaSPaymentStatus" AS ENUM ('COMPLETED', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED', 'CANCELED');

-- AlterTable
ALTER TABLE "brand_customer_payments" DROP COLUMN "status",
ADD COLUMN     "status" "BrandPaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "payment_transactions" DROP COLUMN "status",
ADD COLUMN     "status" "SaaSPaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "status",
ADD COLUMN     "status" "SaaSPaymentStatus" NOT NULL DEFAULT 'SUCCESS';

-- CreateIndex
CREATE INDEX "brand_customer_payments_status_idx" ON "brand_customer_payments"("status");
