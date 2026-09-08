-- Phase 5: Add performance indexes for high-traffic scaling
-- Safe migration: only adds indexes, no data changes

-- Product: composite index for active+approved products (most common query)
CREATE INDEX IF NOT EXISTS "Product_isActive_isApproved_idx" ON "Product"("isActive", "isApproved");

-- Product: composite for category+active+approved (product listing by category)
CREATE INDEX IF NOT EXISTS "Product_categoryId_isActive_isApproved_idx" ON "Product"("categoryId", "isActive", "isApproved");

-- Product: composite for seller+active (seller product management)
CREATE INDEX IF NOT EXISTS "Product_sellerId_isActive_idx" ON "Product"("sellerId", "isActive");

-- Product: stock check (inventory queries)
CREATE INDEX IF NOT EXISTS "Product_stock_idx" ON "Product"("stock");

-- Product: soldCount for popularity sorting
CREATE INDEX IF NOT EXISTS "Product_soldCount_idx" ON "Product"("soldCount");

-- Order: composite for user+status (order history)
CREATE INDEX IF NOT EXISTS "Order_userId_status_idx" ON "Order"("userId", "status");

-- Order: composite for seller+status (seller order management)
CREATE INDEX IF NOT EXISTS "Order_sellerId_status_idx" ON "Order"("sellerId", "status");

-- Order: payment status queries
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- Notification: composite for unread count
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- Coupon: active coupons lookup
CREATE INDEX IF NOT EXISTS "Coupon_isActive_expiresAt_idx" ON "Coupon"("isActive", "expiresAt");

-- Banner: active home banners
CREATE INDEX IF NOT EXISTS "Banner_isActive_type_position_idx" ON "Banner"("isActive", "type", "position");

-- Inventory: stock check by product
CREATE INDEX IF NOT EXISTS "Inventory_productId_warehouseId_idx" ON "Inventory"("productId", "warehouseId");

-- Inventory: stock check by variant
CREATE INDEX IF NOT EXISTS "Inventory_variantId_warehouseId_idx" ON "Inventory"("variantId", "warehouseId");

-- UserEvent: analytics queries
CREATE INDEX IF NOT EXISTS "UserEvent_type_createdAt_idx" ON "UserEvent"("type", "createdAt");

-- FlashSale: active flash sales
CREATE INDEX IF NOT EXISTS "FlashSale_isActive_startsAt_endsAt_idx" ON "FlashSale"("isActive", "startsAt", "endsAt");

-- ProductAttribute: key-value lookups
CREATE INDEX IF NOT EXISTS "ProductAttribute_key_value_idx" ON "ProductAttribute"("key", "value");

-- AuditLog: resource lookups
CREATE INDEX IF NOT EXISTS "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

-- Review: product+active for product page reviews
CREATE INDEX IF NOT EXISTS "Review_productId_isActive_idx" ON "Review"("productId", "isActive");

-- SellerCommission: status for settlement processing
CREATE INDEX IF NOT EXISTS "SellerCommission_sellerId_status_idx" ON "SellerCommission"("sellerId", "status");

-- LoyaltyTransaction: account+type for balance calculation
CREATE INDEX IF NOT EXISTS "LoyaltyTransaction_accountId_type_idx" ON "LoyaltyTransaction"("accountId", "type");
