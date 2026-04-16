-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "city" TEXT;

-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "city" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Offer_city_idx" ON "Offer"("city");
