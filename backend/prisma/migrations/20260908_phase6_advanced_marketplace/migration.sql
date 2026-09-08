-- Phase 6: Global & Advanced Marketplace
-- Migration: 20260908_phase6_advanced_marketplace

-- Feature Flags (using SystemConfig table - already exists)
-- Keys: feature:AI_ASSISTANT, feature:VOICE_SEARCH, feature:IMAGE_SEARCH, feature:BARCODE_SEARCH
--        feature:LOYALTY, feature:MEMBERSHIP, feature:REFERRALS, feature:ANALYTICS

-- Analytics Events (enhance existing UserEvent table)
-- Already has: id, userId, sessionId, type, productId, metadata, createdAt
-- No schema changes needed - analytics service uses existing UserEvent table

-- Fraud Risk Events (already exists in schema)
-- Already has: id, userId, sessionId, type, riskLevel, score, details, reviewedBy, reviewedAt, action
-- No schema changes needed

-- Referral System (already exists in schema)
-- Already has: Referral, ReferralReward, ReferralEvent
-- No schema changes needed

-- Loyalty System (already exists in schema)
-- Already has: LoyaltyAccount, LoyaltyTransaction, LoyaltyRule
-- No schema changes needed

-- Membership System (already exists in schema)
-- Already has: MembershipPlan, MembershipSubscription
-- No schema changes needed

-- AI System (already exists in schema)
-- Already has: AiConversation, AiConversationMessage, AiSearchQuery, ProductEmbedding, AiRecommendationScore
-- No schema changes needed

-- i18n (uses SystemConfig table - already exists)
-- Keys: i18n:en, i18n:hi, i18n:{lang}
-- No schema changes needed

-- Add indexes for new query patterns
CREATE INDEX IF NOT EXISTS "UserEvent_userId_type_createdAt_idx" ON "UserEvent"("userId", "type", "createdAt");
CREATE INDEX IF NOT EXISTS "UserEvent_productId_type_idx" ON "UserEvent"("productId", "type");
CREATE INDEX IF NOT EXISTS "AiSearchQuery_userId_createdAt_idx" ON "AiSearchQuery"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiConversation_userId_createdAt_idx" ON "AiConversation"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "LoyaltyTransaction_accountId_type_idx" ON "LoyaltyTransaction"("accountId", "type");
CREATE INDEX IF NOT EXISTS "Referral_userId_idx" ON "Referral"("userId");
CREATE INDEX IF NOT EXISTS "Referral_code_idx" ON "Referral"("code");
CREATE INDEX IF NOT EXISTS "ReferralReward_referralId_idx" ON "ReferralReward"("referralId");
CREATE INDEX IF NOT EXISTS "FraudRiskEvent_userId_type_idx" ON "FraudRiskEvent"("userId", "type");
CREATE INDEX IF NOT EXISTS "Product_variant_sku_idx" ON "ProductVariant"("sku");
CREATE INDEX IF NOT EXISTS "Product_hsnCode_idx" ON "Product"("hsnCode");
