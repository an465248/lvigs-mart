-- Phase 5: Banner Enhancements
-- Add mobile image, CTA fields, sort order, and additional indexes

-- Add new columns to Banner table
ALTER TABLE "Banner" ADD COLUMN "mobileImage" TEXT;
ALTER TABLE "Banner" ADD COLUMN "ctaText" TEXT;
ALTER TABLE "Banner" ADD COLUMN "ctaUrl" TEXT;
ALTER TABLE "Banner" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Add new indexes for Banner
CREATE INDEX "Banner_isActive_sortOrder_idx" ON "Banner"("isActive", "sortOrder");
CREATE INDEX "Banner_startsAt_endsAt_idx" ON "Banner"("startsAt", "endsAt");
CREATE INDEX "Banner_startAt_endAt_idx" ON "Banner"("startAt", "endAt");

-- Add performance indexes for Product
CREATE INDEX "Product_categoryId_brandId_isActive_idx" ON "Product"("categoryId", "brandId", "isActive");
CREATE INDEX "Product_soldCount_idx" ON "Product"("soldCount");
CREATE INDEX "Product_isActive_isApproved_idx" ON "Product"("isActive", "isApproved");
CREATE INDEX "Product_isBestseller_idx" ON "Product"("isBestseller");
CREATE INDEX "Product_isNewArrival_idx" ON "Product"("isNewArrival");
CREATE INDEX "Product_isFlashDeal_idx" ON "Product"("isFlashDeal");

-- Add performance indexes for Order
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_paymentMethod_idx" ON "Order"("paymentMethod");
CREATE INDEX "Order_shortId_idx" ON "Order"("shortId");

-- Add performance indexes for CartItem
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- Add performance indexes for WishlistItem
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");
