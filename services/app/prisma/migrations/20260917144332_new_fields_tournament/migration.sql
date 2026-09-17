-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "google_maps_url" TEXT;
