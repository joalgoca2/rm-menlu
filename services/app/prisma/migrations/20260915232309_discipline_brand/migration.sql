/*
  Warnings:

  - A unique constraint covering the columns `[brand_id,name]` on the table `disciplines` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "disciplines_brand_id_name_key" ON "disciplines"("brand_id", "name");
