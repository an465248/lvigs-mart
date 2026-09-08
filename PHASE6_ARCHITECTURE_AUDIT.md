# PHASE 6 ARCHITECTURE AUDIT — LVIGS Mart

Generated: 2026-09-08

---

## EXECUTIVE SUMMARY

The LVIGS Mart codebase has **significant pre-existing infrastructure** across all three platforms. Many Phase 6 features already have backend modules, database models, and API endpoints. The primary work is **connecting existing backend systems to frontend/mobile**, **completing incomplete implementations**, and **adding missing pieces**.

### Key Findings

| Area | Backend Status | Frontend Status | Mobile Status |
|------|---------------|-----------------|---------------|
| AI Assistant | Module exists, basic NLP | UI exists, mocked | Not present |
| Recommendations | Service exists, basic | Types exist | Not present |
| Search (Voice/Image/Barcode) | Controller exists | UI components exist | Not present |
| Loyalty | Service + controller exist | Page exists, mocked | Not present |
| Membership | Service + controller exist | Page exists, mocked | Not present |
| Referrals | Model exists, no service | Not present | Not present |
| i18n | Controller with translations | Framework exists, not wired | Not present |
| Feature Flags | SystemConfig model exists | Not present | Not present |
| Analytics | Events module exists | Not present | Not present |
| Fraud/Risk | Admin fraud events exist | Not present | Not present |

---

## 1. EXISTING BACKEND INFRASTRUCTURE

### Modules Already Present (22 total)
```
ai/           -- AI shopping assistant (basic NLP intent extraction)
recommendations/ -- For-you, trending, similar, frequently-bought
search/       -- Text search with OpenSearch fallback
loyalty/      -- Points account, earn/redeem, tier
membership/   -- Plans, subscriptions
alerts/       -- Price and stock alerts
events/       -- User event tracking
i18n/         -- Translation controller
support/      -- Support tickets
delivery/     -- Delivery agent management
commissions/  -- Commission config
coupons/      -- Coupon validation
banners/      -- Banner/offer/flash-sale CRUD
uploads/      -- S3/local file upload
```

### Database Models Already Present
- `AiConversation`, `AiConversationMessage`, `AiSearchQuery` — AI chat
- `ProductEmbedding` — AI product understanding
- `AiRecommendationScore` — Recommendation scoring
- `Recommendation` — Stored recommendations
- `LoyaltyAccount`, `LoyaltyTransaction`, `LoyaltyRule` — Loyalty ledger
- `MembershipPlan`, `MembershipSubscription` — Membership
- `Referral`, `ReferralReward`, `ReferralEvent` — Referrals
- `FraudRiskEvent` — Fraud detection
- `NotificationPreference` — Notification settings
- `AiSupportSession` — AI support
- `SystemConfig` — Feature flags/config
- `PriceHistory` — Price tracking
- `RecentlyViewed` — View history
- `ProductQuestion`, `ProductAnswer` — Q&A

### API Endpoints Already Present
- `POST /api/ai/chat` — AI assistant
- `GET /api/ai/conversations` — AI conversations
- `GET /api/recommendations/*` — 8 recommendation endpoints
- `GET /api/loyalty/*` — 5 loyalty endpoints
- `GET /api/membership/*` — 4 membership endpoints
- `POST /api/events/track` — Event tracking
- `GET /api/i18n/:lang` — Translations
- `POST /api/alerts/price` — Price alerts
- `POST /api/alerts/stock` — Stock alerts

---

## 2. FRONTEND INFRASTRUCTURE

### Already Present
- AI Assistant widget + full page (mocked)
- Voice search (Web Speech API)
- Image search (UI only, backend mocked)
- Barcode search (BarcodeDetector API)
- i18n framework (en/hi, 85 keys)
- LanguageSwitcher component
- Loyalty page (mocked)
- Membership page (mocked)
- SmartDeals component (mock scoring)
- ArViewer, ModelViewer (CSS only)

### Missing
- Test infrastructure (no Jest/Vitest/Playwright)
- Real API integration for AI/loyalty/membership
- Product comparison page
- Feature flag consumer
- Currency selector

---

## 3. MOBILE INFRASTRUCTURE

### Already Present
- Firebase Phone Auth
- Basic API service (4 endpoints)
- Banner carousel
- Pincode lookup

### Missing (Nearly everything)
- No e-commerce screens (products, cart, checkout, orders)
- No state management
- No models directory
- No localization
- No AI/search/recommendation features

---

## 4. CRITICAL SECURITY FINDINGS

| Severity | Finding | Location |
|----------|---------|----------|
| CRITICAL | Firebase service account JSON with private key committed to repo | `backend/firebase.json` |
| HIGH | Default JWT secrets in .env | `backend/.env:5-6` |
| HIGH | Admin/seller auth is localStorage-only (no JWT validation) | `frontend/src/lib/admin-auth.ts`, `seller-auth.ts` |
| MEDIUM | Dev payment mock returns auto-verified payments | `backend/src/modules/payments/payments.service.ts:51-63` |
| MEDIUM | Hardcoded private IP in frontend/mobile .env | `10.47.26.171:4000` |
| LOW | OTP logged to console in dev mode | `backend/src/modules/auth/otp.service.ts:42-43` |

---

## 5. INCOMPLETE/STUB IMPLEMENTATIONS

| Component | File | Issue |
|-----------|------|-------|
| Google Sign-In | `auth.service.ts:187` | Throws "not implemented" |
| Apple Sign-In | `auth.service.ts:191` | Throws "not implemented" |
| Pincode serviceability | `addresses.service.ts:31` | Always returns serviceable=true |
| AI assistant | `ai.service.ts` | Keyword matching only, no LLM |
| SmartDeals scoring | `SmartDeals.tsx:29` | Uses Math.random() |
| Image search | `ImageSearch.tsx` | setTimeout mock, no vision API |
| Barcode search | `BarcodeSearch.tsx` | Passes barcode as text query |
| Price alerts (frontend) | Product detail page | React state only, not persisted |
| Sentry | `lib/sentry.tsx` | Stub only |

---

## 6. HARDCODED DATA

| Location | Data | Impact |
|----------|------|--------|
| `search.service.ts:13-17` | Trending searches array | Low — can be replaced with DB |
| `orders.service.ts:25-26` | Delivery fee ₹49, tax 5% | Medium — should be configurable |
| `commissions.service.ts:70` | 10% fallback commission | Medium — should use config |
| `i18n.controller.ts:5-132` | All translations hardcoded | Medium — should use DB |
| `CategoryGrid.tsx` | 12 categories hardcoded | Low — duplicates mock-data |
| `Header.tsx:87` | "Bengaluru 560001" address | Low — should use user address |
| `FlashDeals.tsx:10` | Timer 5:42:18 | Low — should use server time |

---

## 7. TEST COVERAGE

### Backend (10 test files)
- Auth Firebase: ✅
- Firebase Service: ✅
- Firebase Guard: ✅
- Pincode Lookup: ✅
- Orders: ✅
- Search: ✅
- Banners: ✅
- Uploads: ✅
- Queue: ✅
- Payments: ✅

### Frontend: ❌ No test infrastructure
### Mobile: 1 stale test + 1 address form test

---

## 8. PHASE 6 IMPLEMENTATION PLAN

### Priority 1: Core AI & Search (Steps 2-10)
1. **Enhance AI service** — Add LLM provider abstraction, product search integration, conversation memory
2. **Add AI guardrails** — Input/output validation, PII protection, rate limiting
3. **Complete recommendation engine** — Use existing UserEvent data, add collaborative filtering
4. **Wire voice/image/barcode search** — Connect existing frontend UI to real backend endpoints
5. **Add product comparison** — New endpoint using existing ProductAttribute model

### Priority 2: Commerce Features (Steps 11-15)
6. **Complete loyalty system** — Wire existing backend to frontend, add earn rules
7. **Complete membership** — Wire existing plans to frontend
8. **Add referral system** — Build on existing Referral/ReferralReward models
9. **Enhance offers engine** — Build on existing Coupon/Offer models

### Priority 3: Platform Features (Steps 16-23)
10. **Wire i18n** — Connect existing translations to frontend components
11. **Add feature flags** — Build on SystemConfig model
12. **Add analytics events** — Build on existing Events module
13. **Add fraud/risk scoring** — Build on existing FraudRiskEvent model

### Priority 4: Frontend/Mobile (Steps 24-26)
14. **Connect frontend to real APIs** — Replace mock data
15. **Add Flutter e-commerce screens** — Products, cart, checkout, orders
16. **Add Flutter AI/search features** — Voice, image, barcode

### Priority 5: Testing & Documentation (Steps 30-34)
17. **Add frontend test infrastructure** — Vitest + Playwright
18. **Expand backend tests** — Cover new services
19. **Documentation** — Architecture, API, security docs

---

## 9. FILES TO CREATE/MODIFY

### New Backend Files
```
backend/src/modules/ai/ai.guardrails.ts
backend/src/modules/ai/ai.context.service.ts
backend/src/modules/ai/ai.recommendation.service.ts
backend/src/modules/ai/ai.intent.service.ts
backend/src/modules/recommendations/recommendations.engine.ts
backend/src/modules/search/search.voice.controller.ts
backend/src/modules/search/search.image.controller.ts
backend/src/modules/search/search.barcode.controller.ts
backend/src/modules/products/products.comparison.service.ts
backend/src/modules/loyalty/loyalty.rules.service.ts
backend/src/modules/referrals/referrals.module.ts
backend/src/modules/referrals/referrals.service.ts
backend/src/modules/referrals/referrals.controller.ts
backend/src/modules/feature-flags/feature-flags.module.ts
backend/src/modules/feature-flags/feature-flags.service.ts
backend/src/modules/feature-flags/feature-flags.guard.ts
backend/src/modules/analytics/analytics.module.ts
backend/src/modules/analytics/analytics.service.ts
backend/src/modules/analytics/analytics.controller.ts
backend/src/modules/fraud/fraud.module.ts
backend/src/modules/fraud/fraud.service.ts
backend/src/modules/fraud/fraud.controller.ts
backend/src/modules/i18n/i18n.service.ts
```

### New Frontend Files
```
frontend/src/lib/api-recommendations.ts
frontend/src/lib/api-ai.ts
frontend/src/lib/api-loyalty.ts
frontend/src/lib/api-feature-flags.ts
frontend/src/components/search/BarcodeScanner.tsx
frontend/src/components/product/CompareBar.tsx
frontend/src/app/compare/page.tsx
frontend/src/app/referrals/page.tsx
```

### New Mobile Files
```
mobile/lib/models/product.dart
mobile/lib/models/cart_item.dart
mobile/lib/models/order.dart
mobile/lib/screens/product_list_screen.dart
mobile/lib/screens/product_detail_screen.dart
mobile/lib/screens/cart_screen.dart
mobile/lib/screens/checkout_screen.dart
mobile/lib/screens/orders_screen.dart
mobile/lib/screens/search_screen.dart
mobile/lib/screens/voice_search_screen.dart
mobile/lib/services/product_service.dart
mobile/lib/services/cart_service.dart
mobile/lib/services/order_service.dart
mobile/lib/services/search_service.dart
mobile/lib/widgets/product_card.dart
mobile/lib/widgets/search_bar.dart
mobile/lib/widgets/voice_input.dart
mobile/lib/widgets/image_search.dart
mobile/lib/widgets/barcode_scanner.dart
mobile/lib/utils/localization.dart
mobile/lib/utils/currency.dart
```

---

## 10. ENVIRONMENT VARIABLES NEEDED

```env
# AI Provider
AI_PROVIDER=openai|anthropic|local
AI_API_KEY=placeholder
AI_MODEL=gpt-4|gpt-3.5-turbo
AI_TIMEOUT=30000
AI_MAX_TOKENS=2000

# Feature Flags
FEATURE_AI_ASSISTANT=true
FEATURE_VOICE_SEARCH=true
FEATURE_IMAGE_SEARCH=true
FEATURE_BARCODE_SEARCH=true
FEATURE_LOYALTY=true
FEATURE_MEMBERSHIP=true
FEATURE_REFERRALS=true

# Recommendations
RECOMMENDATION_ENABLED=true
RECOMMENDATION_CACHE_TTL=3600

# i18n
DEFAULT_CURRENCY=INR
DEFAULT_LOCALE=en-IN

# Fraud Detection
FRAUD_DETECTION_ENABLED=true
FRAUD_RISK_THRESHOLD=0.7
```

---

## 11. BLOCKERS

1. **PostgreSQL not running** — Cannot run migrations or integration tests
2. **No LLM API key** — AI assistant will use fallback behavior
3. **Frontend npm install timeout** — Cannot verify frontend build
4. **Flutter SDK** — Cannot verify mobile build
5. **Firebase service account in repo** — Security risk, should be in env only

---

## 12. RECOMMENDATIONS

1. **Do NOT rebuild existing modules** — The backend already has AI, recommendations, loyalty, membership, i18n, events, alerts, support, delivery modules
2. **Focus on wiring** — Connect existing backend to frontend/mobile
3. **Enhance, don't replace** — Add LLM integration to existing AI service
4. **Fix security issues** — Remove firebase.json from repo, add JWT to admin/seller auth
5. **Add tests incrementally** — Start with critical commerce paths
