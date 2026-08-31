/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `brands` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "is_slug_locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "brand_plan_configs" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceYearly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_plan_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_customer_payments" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "brand_plan_id" TEXT,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "concept" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gateway_provider" TEXT NOT NULL,
    "transaction_ref" TEXT,
    "checkout_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_customer_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_plan_configs_brand_id_idx" ON "brand_plan_configs"("brand_id");

-- CreateIndex
CREATE INDEX "brand_customer_payments_brand_id_idx" ON "brand_customer_payments"("brand_id");

-- CreateIndex
CREATE INDEX "brand_customer_payments_status_idx" ON "brand_customer_payments"("status");

-- CreateIndex
CREATE INDEX "brand_customer_payments_created_at_idx" ON "brand_customer_payments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- AddForeignKey
ALTER TABLE "brand_plan_configs" ADD CONSTRAINT "brand_plan_configs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_customer_payments" ADD CONSTRAINT "brand_customer_payments_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_customer_payments" ADD CONSTRAINT "brand_customer_payments_brand_plan_id_fkey" FOREIGN KEY ("brand_plan_id") REFERENCES "brand_plan_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
