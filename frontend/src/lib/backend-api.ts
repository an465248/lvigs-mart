/**
 * Real API client for LVIGS Mart NestJS backend.
 * 
 * Environment variable: NEXT_PUBLIC_API_BASE_URL (default: http://localhost:4000)
 * 
 * This module provides typed functions that call the actual backend API.
 * In development, the mock API (api.ts) may still be used.
 * In production, this module should be the source of truth.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function apiFetch<T>(
  path: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    token?: string;
  }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: options?.method || "GET",
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============================================================
// Auth
// ============================================================

export async function firebaseLogin(idToken: string) {
  return apiFetch<{ user: any; accessToken: string }>("/auth/firebase/login", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
}

export async function firebaseSignup(data: { name?: string; email?: string }, idToken: string) {
  return apiFetch<{ user: any; accessToken: string }>("/auth/firebase/signup", {
    method: "POST",
    body: data,
    headers: { Authorization: `Bearer ${idToken}` },
  });
}

// ============================================================
// Products
// ============================================================

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  sort?: string;
  q?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) searchParams.set(key, String(val));
    });
  }
  const query = searchParams.toString();
  return apiFetch<any>(`/products${query ? `?${query}` : ""}`);
}

export async function getProductBySlug(slug: string) {
  return apiFetch<any>(`/products/${slug}`);
}

export async function getRelatedProducts(productId: string, categoryId: string) {
  return apiFetch<any[]>(`/products/${productId}/related?categoryId=${categoryId}&limit=6`);
}

// ============================================================
// Categories
// ============================================================

export async function getCategories() {
  return apiFetch<any[]>("/products/categories");
}

export async function getCategoryBySlug(slug: string) {
  return apiFetch<any>(`/products/categories/${slug}`);
}

// ============================================================
// Brands
// ============================================================

export async function getBrands() {
  return apiFetch<any[]>("/products/brands");
}

// ============================================================
// Search
// ============================================================

export async function searchProducts(query: string, limit?: number) {
  return apiFetch<any[]>(`/search?q=${encodeURIComponent(query)}${limit ? `&limit=${limit}` : ""}`);
}

export async function getSearchSuggestions(query: string) {
  return apiFetch<any>(`/search/suggestions?q=${encodeURIComponent(query)}`);
}

export async function getTrendingSearches() {
  return apiFetch<string[]>("/search/trending");
}

// ============================================================
// Cart
// ============================================================

export async function getCart(token: string) {
  return apiFetch<any>("/cart", { token });
}

export async function addToCart(data: { productId: string; variantId?: string; quantity?: number }, token: string) {
  return apiFetch<any>("/cart", { method: "POST", body: data, token });
}

export async function updateCartItem(itemId: string, data: { quantity: number }, token: string) {
  return apiFetch<any>(`/cart/${itemId}`, { method: "PUT", body: data, token });
}

export async function removeFromCart(itemId: string, token: string) {
  return apiFetch<any>(`/cart/${itemId}`, { method: "DELETE", token });
}

// ============================================================
// Orders
// ============================================================

export async function placeOrder(data: {
  addressId: string;
  paymentMethod: string;
  couponCode?: string;
  idempotencyKey?: string;
}, token: string) {
  return apiFetch<any>("/orders", { method: "POST", body: data, token });
}

export async function getOrders(token: string) {
  return apiFetch<any[]>("/orders", { token });
}

export async function getOrder(orderId: string, token: string) {
  return apiFetch<any>(`/orders/${orderId}`, { token });
}

export async function cancelOrder(orderId: string, reason: string, token: string) {
  return apiFetch<any>(`/orders/${orderId}/cancel`, { method: "POST", body: { reason }, token });
}

// ============================================================
// Payments
// ============================================================

export async function createRazorpayOrder(orderId: string, token: string) {
  return apiFetch<any>(`/payments/create-order/${orderId}`, { method: "POST", token });
}

export async function verifyPayment(data: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}, token: string) {
  return apiFetch<any>("/payments/verify", { method: "POST", body: data, token });
}

// ============================================================
// Addresses
// ============================================================

export async function getAddresses(token: string) {
  return apiFetch<any[]>("/addresses", { token });
}

export async function addAddress(data: any, token: string) {
  return apiFetch<any>("/addresses", { method: "POST", body: data, token });
}

export async function updateAddress(id: string, data: any, token: string) {
  return apiFetch<any>(`/addresses/${id}`, { method: "PUT", body: data, token });
}

export async function deleteAddress(id: string, token: string) {
  return apiFetch<any>(`/addresses/${id}`, { method: "DELETE", token });
}

export async function lookupPincode(pincode: string) {
  return apiFetch<any>(`/location/pincode/${pincode}`);
}

// ============================================================
// Wishlist
// ============================================================

export async function getWishlist(token: string) {
  return apiFetch<any[]>("/wishlist", { token });
}

export async function addToWishlist(productId: string, token: string) {
  return apiFetch<any>(`/wishlist/toggle/${productId}`, { method: "POST", token });
}

export async function removeFromWishlist(productId: string, token: string) {
  return apiFetch<any>(`/wishlist/toggle/${productId}`, { method: "POST", token });
}

// ============================================================
// Reviews
// ============================================================

export async function getReviews(productId: string) {
  return apiFetch<any[]>(`/reviews/product/${productId}`);
}

export async function addReview(data: { productId: string; rating: number; title?: string; body: string }, token: string) {
  return apiFetch<any>(`/reviews/product/${data.productId}`, { method: "POST", body: data, token });
}

// ============================================================
// Notifications
// ============================================================

export async function getNotifications(token: string) {
  return apiFetch<any[]>("/notifications", { token });
}

export async function markNotificationRead(id: string, token: string) {
  return apiFetch<any>(`/notifications/${id}/read`, { method: "POST", token });
}

export async function markAllNotificationsRead(token: string) {
  return apiFetch<any>("/notifications/read-all", { method: "POST", token });
}

export async function getUnreadCount(token: string) {
  return apiFetch<{ count: number }>("/notifications/unread-count", { token });
}

// ============================================================
// Banners (Home Page)
// ============================================================

export async function getBanners() {
  return apiFetch<any[]>("/banners/active");
}

// ============================================================
// Health Check
// ============================================================

export async function healthCheck() {
  return apiFetch<{ status: string; checks: Record<string, string> }>("/health/ready");
}
