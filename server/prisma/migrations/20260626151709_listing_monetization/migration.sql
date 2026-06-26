-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "boosted_until" TIMESTAMP(3),
ADD COLUMN     "featured_until" TIMESTAMP(3),
ADD COLUMN     "shop_id" INTEGER;

-- CreateIndex
CREATE INDEX "listings_shop_id_idx" ON "listings"("shop_id");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

