// Phase 6 API Client - Advanced Marketplace Features
// Connects to real NestJS backend endpoints

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("lvigs.token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ========== AI Shopping Assistant ==========
export async function aiChat(message: string, sessionId?: string) {
  return apiFetch<{ reply: string; products: any[]; intent: any; conversationId: string }>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, sessionId }),
  });
}

export async function getAiConversations(page = 1, limit = 20) {
  return apiFetch<{ items: any[]; pagination: any }>(`/ai/conversations?page=${page}&limit=${limit}`);
}

export async function getAiConversation(id: string) {
  return apiFetch<any>(`/ai/conversations/${id}`);
}

// ========== Search ==========
export async function searchProducts(q: string, limit = 20) {
  return apiFetch<any[]>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}

export async function getSearchSuggestions(q: string) {
  return apiFetch<{ products: any[]; categories: any[]; brands: any[] }>(`/search/suggestions?q=${encodeURIComponent(q)}`);
}

export async function getTrendingSearches() {
  return apiFetch<string[]>("/search/trending");
}

export async function voiceSearch(transcript: string, language = "en") {
  return apiFetch<{ found: boolean; query: string; parsedIntent: any; products: any[]; language: string }>("/search/voice", {
    method: "POST",
    body: JSON.stringify({ transcript, language }),
  });
}

export async function imageSearch(imageFile: File) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const token = typeof window !== "undefined" ? localStorage.getItem("lvigs.token") : null;
  const res = await fetch(`${API_BASE}/api/search/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) throw new Error("Image search failed");
  return res.json();
}

// ========== Product Comparison ==========
export async function compareProducts(ids: string[]) {
  return apiFetch<{ products: any[]; attributes: Record<string, any[]>; differences: string[] }>(
    `/products/compare?ids=${ids.join(",")}`
  );
}

// ========== Barcode Search ==========
export async function searchByBarcode(barcode: string) {
  return apiFetch<{ found: boolean; product?: any; message?: string }>(`/products/barcode/${encodeURIComponent(barcode)}`);
}

// ========== Recommendations ==========
export async function getRecommendations(limit = 10) {
  return apiFetch<any[]>(`/recommendations/for-you?limit=${limit}`);
}

export async function getRecommendedProducts() {
  return apiFetch<any[]>("/recommendations/for-you?limit=8");
}

export async function getTrendingNearYou(limit = 10) {
  return apiFetch<any[]>(`/recommendations/trending-near-you?limit=${limit}`);
}

export async function getBecauseYouViewed(productId: string, limit = 10) {
  return apiFetch<any[]>(`/recommendations/because-viewed/${productId}?limit=${limit}`);
}

export async function getFrequentlyBoughtTogether(productId: string) {
  return apiFetch<any[]>(`/recommendations/frequently-bought/${productId}`);
}

export async function getSimilarProducts(productId: string) {
  return apiFetch<any[]>(`/recommendations/similar/${productId}`);
}

// ========== Loyalty ==========
export async function getLoyaltyAccount() {
  return apiFetch<any>("/loyalty/account");
}

export async function getLoyaltyTransactions(page = 1, limit = 20) {
  return apiFetch<{ items: any[]; pagination: any }>(`/loyalty/transactions?page=${page}&limit=${limit}`);
}

export async function earnLoyaltyPoints(points: number, type: string, description?: string, referenceId?: string) {
  return apiFetch<any>("/loyalty/earn", {
    method: "POST",
    body: JSON.stringify({ points, type, description, referenceId }),
  });
}

export async function redeemLoyaltyPoints(points: number, orderId?: string) {
  return apiFetch<any>("/loyalty/redeem", {
    method: "POST",
    body: JSON.stringify({ points, orderId }),
  });
}

export async function getLoyaltyRules() {
  return apiFetch<any[]>("/loyalty/rules");
}

// ========== Membership ==========
export async function getMembershipPlans() {
  return apiFetch<any[]>("/membership/plans");
}

export async function getCurrentMembership() {
  return apiFetch<any>("/membership/current");
}

export async function subscribeMembership(planId: string, billingCycle = "MONTHLY") {
  return apiFetch<any>("/membership/subscribe", {
    method: "POST",
    body: JSON.stringify({ planId, billingCycle }),
  });
}

export async function cancelMembership() {
  return apiFetch<any>("/membership/cancel", { method: "POST" });
}

// ========== Referrals ==========
export async function getReferralCode() {
  return apiFetch<{ code: string }>("/referrals/code", { method: "POST" });
}

export async function getReferralStats() {
  return apiFetch<{ code: string; totalReferred: number; totalEarned: number; pendingRewards: number }>("/referrals/stats");
}

export async function getReferralRewards(page = 1, limit = 20) {
  return apiFetch<{ items: any[]; pagination: any }>(`/referrals/rewards?page=${page}&limit=${limit}`);
}

export async function applyReferralCode(code: string) {
  return apiFetch<any>("/referrals/apply", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// ========== Analytics ==========
export async function trackEvent(event: { type: string; productId?: string; metadata?: any }) {
  return apiFetch<{ eventId: string }>("/analytics/track", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

// ========== Feature Flags ==========
export async function getFeatureFlags() {
  return apiFetch<Record<string, boolean>>("/admin/feature-flags");
}

export async function setFeatureFlag(key: string, enabled: boolean) {
  return apiFetch<any>(`/admin/feature-flags/${key}`, {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
}

// ========== i18n ==========
export async function getTranslations(lang: string) {
  return apiFetch<Record<string, string>>(`/i18n/${lang}`);
}

// ========== Alerts ==========
export async function setPriceAlert(productId: string, targetPrice: number) {
  return apiFetch<any>("/alerts/price", {
    method: "POST",
    body: JSON.stringify({ productId, targetPrice }),
  });
}

export async function setStockAlert(productId: string) {
  return apiFetch<any>("/alerts/stock", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function getPriceAlerts() {
  return apiFetch<any[]>("/alerts/price");
}

export async function getStockAlerts() {
  return apiFetch<any[]>("/alerts/stock");
}
