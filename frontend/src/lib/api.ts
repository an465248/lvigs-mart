/**
 * Real API adapter — maintains mockApi interface but calls the real NestJS backend.
 * Pages continue importing mockApi unchanged.
 */
import type {
  Banner,
  Brand,
  CartItem,
  CartTotals,
  Category,
  NotificationItem,
  Order,
  OrderStatus,
  Product,
  Review,
  SearchSuggestion,
  User,
  WishlistItem,
  Address,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lvigs.accessToken");
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

async function api<T>(
  path: string,
  opts: { method?: string; body?: any; token?: string; headers?: Record<string, string> } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...opts.headers };
  const tok = opts.token || getToken();
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: typeof p.brand === "object" ? p.brand?.name || "" : p.brand || "",
    brandId: p.brandId || p.brand?.id || "",
    categoryId: p.categoryId || p.category?.id || "",
    subcategoryId: p.subcategoryId,
    sellerId: p.sellerId || "",
    sellerName: p.seller?.name || "",
    description: p.description || "",
    highlights: p.highlights || [],
    specifications: p.specifications || [],
    rating: p.rating || 0,
    ratingCount: p.ratingCount || 0,
    reviewCount: p.reviewCount || 0,
    mrp: p.mrp || 0,
    price: p.price || 0,
    images: Array.isArray(p.images)
      ? p.images.map((i: any) => (typeof i === "string" ? i : i.url || ""))
      : [],
    stock: p.stock || 0,
    warranty: p.warranty,
    returnPolicy: p.returnPolicy,
    variants: p.variants,
    deliveryCharge: p.deliveryCharge || 0,
    freeDelivery: p.freeDelivery || false,
    fastDelivery: p.fastDelivery || false,
    isBestseller: p.isBestseller,
    isNewArrival: p.isNewArrival,
    isFlashDeal: p.isFlashDeal,
    tags: p.tags || [],
    createdAt: p.createdAt || new Date().toISOString(),
  };
}

function mapCartItem(c: any): CartItem {
  const p = c.product || {};
  return {
    id: c.id,
    productId: c.productId,
    variantId: c.variantId,
    quantity: c.quantity || 1,
    product: mapProduct(p),
    addedAt: c.addedAt || c.createdAt || new Date().toISOString(),
  };
}

function mapAddress(a: any): Address {
  return {
    id: a.id,
    userId: a.userId,
    label: a.label || "HOME",
    name: a.name || "",
    mobile: a.mobile || a.phone || "",
    pincode: a.pincode || a.zipCode || "",
    line1: a.line1 || a.street || a.addressLine1 || "",
    line2: a.line2 || a.addressLine2 || "",
    landmark: a.landmark || "",
    city: a.city || "",
    state: a.state || "",
    country: a.country || "India",
    isDefault: a.isDefault || false,
  };
}

function mapOrder(o: any): Order {
  return {
    id: o.id,
    shortId: o.shortId || o.id?.slice(0, 8) || "",
    userId: o.userId || "",
    items: (o.items || []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      title: i.title || i.product?.title || "",
      image: i.image || i.product?.images?.[0] || "",
      quantity: i.quantity,
      price: i.price || i.product?.price || 0,
      mrp: i.mrp || i.product?.mrp || 0,
      status: i.status || o.status || "PLACED",
    })),
    address: o.address ? mapAddress(o.address) : ({} as Address),
    payment: {
      method: o.payment?.method || o.paymentMethod || "COD",
      status: o.payment?.status || o.paymentStatus || "PENDING",
      transactionId: o.payment?.transactionId,
    },
    totals: o.totals || {
      itemCount: 0, mrpTotal: 0, priceTotal: 0, itemDiscount: 0,
      couponDiscount: 0, deliveryFee: 0, freeDelivery: true, tax: 0, payable: 0, savings: 0,
    },
    status: o.status || "PLACED",
    timeline: o.timeline || [],
    expectedDelivery: o.expectedDelivery,
    trackingId: o.trackingId,
    createdAt: o.createdAt || new Date().toISOString(),
  };
}

// Recent searches — localStorage only
const RECENT_SEARCHES_KEY = "lvigs.recentSearches";

export const mockApi = {
  async getHomeBanners(): Promise<Banner[]> {
    try {
      const data = await api<any[]>("/banners/active");
      return (data || []).map((b: any) => ({
        id: b.id,
        title: b.title || "",
        subtitle: b.subtitle || "",
        image: b.image || b.imageUrl || "",
        link: b.ctaUrl || b.ctaLink || b.link || "",
        bg: b.bg || b.backgroundColor || "#1a1a2e",
        fg: b.fg || b.textColor || "#ffffff",
        cta: b.ctaText || b.ctaLabel ? {
          label: b.ctaText || b.ctaLabel,
          href: b.ctaUrl || b.ctaLink || "#",
        } : undefined,
      }));
    } catch {
      return [];
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const data = await api<any[]>("/products/categories");
      return (data || []).map((c: any) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        image: c.image,
        order: c.order || 0,
        featured: c.featured,
        subcategories: (c.subcategories || []).map((s: any) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          icon: s.icon,
          image: s.image,
          order: s.order || 0,
        })),
      }));
    } catch {
      return [];
    }
  },

  async getBrands(): Promise<Brand[]> {
    try {
      const data = await api<any[]>("/products/brands");
      return (data || []).map((b: any) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
        logo: b.logo,
      }));
    } catch {
      return [];
    }
  },

  async getTrendingProducts(): Promise<Product[]> {
    try {
      const data = await api<any>("/products?collection=trending&limit=8");
      return (data.items || []).map(mapProduct);
    } catch {
      return [];
    }
  },

  async getBestsellers(): Promise<Product[]> {
    try {
      const data = await api<any>("/products?collection=bestsellers&limit=8");
      return (data.items || []).map(mapProduct);
    } catch {
      return [];
    }
  },

  async getFlashDeals(): Promise<Product[]> {
    try {
      const data = await api<any>("/products?collection=flash-deals&limit=6");
      return (data.items || []).map(mapProduct);
    } catch {
      return [];
    }
  },

  async getNewArrivals(): Promise<Product[]> {
    try {
      const data = await api<any>("/products?collection=new-arrivals&limit=8");
      return (data.items || []).map(mapProduct);
    } catch {
      return [];
    }
  },

  async getRecommended(): Promise<Product[]> {
    try {
      const data = await api<any>("/products?collection=recommended&limit=8");
      return (data.items || []).map(mapProduct);
    } catch {
      return [];
    }
  },

  async getDealsOfTheDay(): Promise<Product[]> {
    try {
      const data = await api<any>("/products?collection=deals-of-the-day&limit=6");
      return (data.items || []).map(mapProduct);
    } catch {
      return [];
    }
  },

  async getCategory(slug: string): Promise<Category | undefined> {
    try {
      const c = await api<any>(`/products/categories/${slug}`);
      if (!c) return undefined;
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        image: c.image,
        order: c.order || 0,
        featured: c.featured,
        subcategories: (c.subcategories || []).map((s: any) => ({
          id: s.id, slug: s.slug, name: s.name, icon: s.icon, image: s.image, order: s.order || 0,
        })),
      };
    } catch {
      return undefined;
    }
  },

  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    try {
      const data = await api<any>(`/products?category=${categorySlug}&limit=50`);
      return (data.items || []).map(mapProduct);
    } catch {
      return [];
    }
  },

  async getProduct(slug: string): Promise<Product | undefined> {
    try {
      const p = await api<any>(`/products/${slug}`);
      if (!p) return undefined;
      return mapProduct(p);
    } catch {
      return undefined;
    }
  },

  async getRelatedProducts(productId: string, categoryId: string): Promise<Product[]> {
    try {
      const data = await api<any[]>(`/products/${productId}/related?categoryId=${categoryId}&limit=6`);
      return (Array.isArray(data) ? data : []).map(mapProduct);
    } catch {
      return [];
    }
  },

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const data = await api<any>(`/search?q=${encodeURIComponent(query)}&limit=20`);
      const items = Array.isArray(data) ? data : (data.items || data.results || []);
      return items.map(mapProduct);
    } catch {
      return [];
    }
  },

  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query.trim()) {
      const recents = mockApi.getRecentSearches();
      return recents.map((r) => ({ type: "QUERY" as const, text: r }));
    }
    try {
      const data = await api<any>(`/search/suggestions?q=${encodeURIComponent(query)}`);
      const items = Array.isArray(data) ? data : (data.suggestions || []);
      return items.map((s: any) => ({
        type: (s.type || "QUERY") as SearchSuggestion["type"],
        text: s.text || s.title || s.name || "",
        payload: s.payload || s.product || s.category,
      }));
    } catch {
      return [];
    }
  },

  async getTrendingSearches(): Promise<string[]> {
    try {
      const data = await api<any>("/search/trending");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getRecentSearches(): string[] {
    return safeRead<string[]>(RECENT_SEARCHES_KEY, []);
  },

  addRecentSearch(q: string) {
    if (!q.trim()) return;
    const list = mockApi.getRecentSearches().filter((x) => x !== q);
    list.unshift(q);
    safeWrite(RECENT_SEARCHES_KEY, list.slice(0, 10));
  },

  clearRecentSearches() {
    safeWrite(RECENT_SEARCHES_KEY, []);
  },

  // Cart — real backend
  async getCartFromApi(): Promise<CartItem[]> {
    const token = getToken();
    if (!token) return [];
    try {
      const data = await api<any>("/cart", { token });
      const items = data?.items || [];
      return items.map(mapCartItem);
    } catch {
      return [];
    }
  },

  getCart(): CartItem[] {
    return safeRead<CartItem[]>(CART_KEY, []);
  },

  saveCart(items: CartItem[]) {
    safeWrite(CART_KEY, items);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lvigs:cart-change"));
    }
  },

  async addToCart(productId: string, quantity = 1) {
    const token = getToken();
    if (token) {
      try {
        await api("/cart", { method: "POST", body: { productId, quantity }, token });
        const items = await mockApi.getCartFromApi();
        mockApi.saveCart(items);
        return;
      } catch {}
    }
    // Fallback: local-only
    const items = mockApi.getCart();
    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, 10);
    }
    mockApi.saveCart(items);
  },

  async updateCartItem(itemId: string, quantity: number) {
    const token = getToken();
    if (token) {
      try {
        await api(`/cart/${itemId}`, { method: "PUT", body: { quantity }, token });
        const items = await mockApi.getCartFromApi();
        mockApi.saveCart(items);
        return;
      } catch {}
    }
    const items = mockApi.getCart();
    const it = items.find((i) => i.id === itemId);
    if (!it) return;
    if (quantity <= 0) {
      mockApi.saveCart(items.filter((i) => i.id !== itemId));
    } else {
      it.quantity = Math.min(quantity, 10);
      mockApi.saveCart(items);
    }
  },

  async removeCartItem(itemId: string) {
    const token = getToken();
    if (token) {
      try {
        await api(`/cart/${itemId}`, { method: "DELETE", token });
        const items = await mockApi.getCartFromApi();
        mockApi.saveCart(items);
        return;
      } catch {}
    }
    mockApi.saveCart(mockApi.getCart().filter((i) => i.id !== itemId));
  },

  async clearCart() {
    const token = getToken();
    if (token) {
      try {
        await api("/cart", { method: "DELETE", token });
      } catch {}
    }
    mockApi.saveCart([]);
  },

  computeTotals(items: CartItem[], couponCode?: string): CartTotals {
    const mrpTotal = items.reduce((s, i) => s + i.product.mrp * i.quantity, 0);
    const priceTotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const itemDiscount = mrpTotal - priceTotal;
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const freeDelivery = priceTotal >= 499;
    const deliveryFee = freeDelivery ? 0 : 49;
    const tax = Math.round(priceTotal * 0.05);
    const payable = priceTotal + deliveryFee + tax;
    return {
      itemCount, mrpTotal, priceTotal, itemDiscount, couponDiscount: 0,
      deliveryFee, freeDelivery, tax, payable, savings: mrpTotal - payable,
    };
  },

  // Wishlist — real backend
  async getWishlistFromApi(): Promise<WishlistItem[]> {
    const token = getToken();
    if (!token) return [];
    try {
      const data = await api<any[]>("/wishlist", { token });
      return (data || []).map((w: any) => ({
        id: w.id,
        product: mapProduct(w.product || w),
        addedAt: w.addedAt || w.createdAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  getWishlist(): WishlistItem[] {
    return safeRead<WishlistItem[]>(WISHLIST_KEY, []);
  },

  saveWishlist(items: WishlistItem[]) {
    safeWrite(WISHLIST_KEY, items);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lvigs:wishlist-change"));
    }
  },

  isWishlisted(productId: string): boolean {
    return mockApi.getWishlist().some((w) => w.product.id === productId);
  },

  async toggleWishlist(productId: string): Promise<boolean> {
    const token = getToken();
    if (token) {
      try {
        await api(`/wishlist/toggle/${productId}`, { method: "POST", token });
        const items = await mockApi.getWishlistFromApi();
        mockApi.saveWishlist(items);
        return items.some((w) => w.product.id === productId);
      } catch {}
    }
    const items = mockApi.getWishlist();
    const exists = items.find((w) => w.product.id === productId);
    if (exists) {
      mockApi.saveWishlist(items.filter((w) => w.product.id !== productId));
      return false;
    }
    return true;
  },

  // Coupons
  async getCoupons(): Promise<any[]> {
    try {
      return await api<any[]>("/coupons");
    } catch {
      return [];
    }
  },

  async validateCoupon(code: string, amount: number): Promise<{ valid: boolean; coupon?: any; reason?: string }> {
    const token = getToken();
    if (!token) return { valid: false, reason: "Login required" };
    try {
      const result = await api<any>("/coupons/validate", { method: "POST", body: { code, amount }, token });
      return { valid: true, coupon: result };
    } catch (err: any) {
      return { valid: false, reason: err.message || "Invalid coupon" };
    }
  },

  // Notifications — real backend
  async getNotificationsFromApi(): Promise<NotificationItem[]> {
    const token = getToken();
    if (!token) return [];
    try {
      const data = await api<any[]>("/notifications", { token });
      return (data || []).map((n: any) => ({
        id: n.id,
        title: n.title || "",
        body: n.body || n.message || "",
        type: n.type || "SYSTEM",
        read: n.read || false,
        at: n.createdAt || new Date().toISOString(),
        orderId: n.orderId,
        image: n.image,
      }));
    } catch {
      return [];
    }
  },

  getNotifications(): NotificationItem[] {
    return safeRead<NotificationItem[]>(NOTIF_KEY, []);
  },

  saveNotifications(list: NotificationItem[]) {
    safeWrite(NOTIF_KEY, list);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lvigs:notifications-change"));
    }
  },

  async markNotificationRead(id: string) {
    const token = getToken();
    if (token) {
      try { await api(`/notifications/${id}/read`, { method: "POST", token }); } catch {}
    }
    const list = mockApi.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    mockApi.saveNotifications(list);
  },

  async markAllNotificationsRead() {
    const token = getToken();
    if (token) {
      try { await api("/notifications/read-all", { method: "POST", token }); } catch {}
    }
    mockApi.saveNotifications(mockApi.getNotifications().map((n) => ({ ...n, read: true })));
  },

  // Auth — localStorage for user profile
  getUser(): User | null {
    return safeRead<User | null>(USER_KEY, null);
  },

  setUser(u: User | null) {
    safeWrite(USER_KEY, u);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lvigs:user-change"));
    }
  },

  // Address — real backend
  async getAddressesFromApi(): Promise<Address[]> {
    const token = getToken();
    if (!token) return [];
    try {
      const data = await api<any[]>("/addresses", { token });
      return (data || []).map(mapAddress);
    } catch {
      return [];
    }
  },

  getAddresses(): Address[] {
    return safeRead<Address[]>(ADDRESSES_KEY, []);
  },

  saveAddresses(list: Address[]) {
    safeWrite(ADDRESSES_KEY, list);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lvigs:addresses-change"));
    }
  },

  async addAddress(a: Address) {
    const token = getToken();
    if (token) {
      try {
        const result = await api<any>("/addresses", { method: "POST", body: a, token });
        const addr = mapAddress(result);
        const list = mockApi.getAddresses();
        if (a.isDefault) list.forEach((x) => (x.isDefault = false));
        mockApi.saveAddresses([...list, addr]);
        return;
      } catch {}
    }
    const list = mockApi.getAddresses();
    if (a.isDefault) list.forEach((x) => (x.isDefault = false));
    mockApi.saveAddresses([...list, a]);
  },

  async updateAddress(a: Address) {
    const token = getToken();
    if (token) {
      try {
        await api(`/addresses/${a.id}`, { method: "PUT", body: a, token });
        const list = await mockApi.getAddressesFromApi();
        mockApi.saveAddresses(list.length ? list : mockApi.getAddresses().map((x) => (x.id === a.id ? a : x)));
        return;
      } catch {}
    }
    let list = mockApi.getAddresses().map((x) => (x.id === a.id ? a : x));
    if (a.isDefault) list = list.map((x) => ({ ...x, isDefault: x.id === a.id }));
    mockApi.saveAddresses(list);
  },

  async removeAddress(id: string) {
    const token = getToken();
    if (token) {
      try {
        await api(`/addresses/${id}`, { method: "DELETE", token });
        const list = await mockApi.getAddressesFromApi();
        mockApi.saveAddresses(list.length ? list : mockApi.getAddresses().filter((a) => a.id !== id));
        return;
      } catch {}
    }
    mockApi.saveAddresses(mockApi.getAddresses().filter((a) => a.id !== id));
  },

  // Orders — real backend
  async getOrdersFromApi(): Promise<Order[]> {
    const token = getToken();
    if (!token) return [];
    try {
      const data = await api<any[]>("/orders", { token });
      return (data || []).map(mapOrder);
    } catch {
      return [];
    }
  },

  getOrders(): Order[] {
    return safeRead<Order[]>("lvigs.orders", []);
  },

  saveOrders(list: Order[]) {
    safeWrite("lvigs.orders", list);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lvigs:orders-change"));
    }
  },

  async placeOrder(input: {
    items: CartItem[];
    address: Address;
    paymentMethod: Order["payment"]["method"];
    couponCode?: string;
  }): Promise<Order> {
    const token = getToken();
    if (!token) throw new Error("Login required");
    const result = await api<any>("/orders", {
      method: "POST",
      body: {
        addressId: input.address.id,
        paymentMethod: input.paymentMethod,
        couponCode: input.couponCode,
      },
      token,
    });
    const order = mapOrder(result);
    const list = mockApi.getOrders();
    mockApi.saveOrders([order, ...list]);
    mockApi.saveCart([]);
    return order;
  },

  async getOrder(id: string): Promise<Order | undefined> {
    const token = getToken();
    if (token) {
      try {
        const data = await api<any>(`/orders/${id}`, { token });
        return data ? mapOrder(data) : undefined;
      } catch {}
    }
    return mockApi.getOrders().find((o) => o.id === id || o.shortId === id);
  },

  async cancelOrder(id: string): Promise<void> {
    const token = getToken();
    if (token) {
      try {
        await api(`/orders/${id}/cancel`, { method: "POST", body: { reason: "Cancelled by user" }, token });
      } catch {}
    }
    const list = mockApi.getOrders().map((o) =>
      o.id === id
        ? {
            ...o,
            status: "CANCELLED" as OrderStatus,
            timeline: [...o.timeline, { status: "CANCELLED" as OrderStatus, at: new Date().toISOString(), note: "Cancelled by user" }],
          }
        : o
    );
    mockApi.saveOrders(list);
  },

  // Reviews — real backend
  async getReviews(productId: string): Promise<Review[]> {
    try {
      const data = await api<any[]>(`/reviews/product/${productId}`);
      return (data || []).map((r: any) => ({
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        userName: r.user?.name || r.userName || "Anonymous",
        rating: r.rating || 0,
        title: r.title || "",
        body: r.body || r.comment || "",
        images: r.images || [],
        verified: r.verified || false,
        helpful: r.helpful || 0,
        createdAt: r.createdAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },
};

// localStorage keys
const CART_KEY = "lvigs.cart";
const WISHLIST_KEY = "lvigs.wishlist";
const USER_KEY = "lvigs.user";
const ADDRESSES_KEY = "lvigs.addresses";
const NOTIF_KEY = "lvigs.notifications";

// Auth — real Firebase OTP + backend
export async function sendOtp(mobile: string): Promise<{ ok: boolean; devCode?: string; reason?: string; retryAfter?: number; ttl?: number }> {
  // Firebase handles OTP on client. This is a no-op for backend.
  return { ok: true };
}

export async function verifyOtp(mobile: string, otp: string): Promise<{ ok: boolean; user?: User; reason?: string }> {
  // Firebase handles OTP verification on client
  return { ok: false, reason: "Use Firebase OTP flow" };
}

export async function firebaseLogin(
  idToken: string
): Promise<{ ok: boolean; accessToken?: string; refreshToken?: string; user?: User; reason?: string }> {
  const res = await fetch(`${API_BASE}/api/auth/firebase/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    },
  });
  const data = await res.json();
  if (data.accessToken) {
    safeWrite("lvigs.accessToken", data.accessToken);
    safeWrite("lvigs.refreshToken", data.refreshToken);
    if (data.user) safeWrite(USER_KEY, data.user);
  }
  return data;
}

export async function firebaseSignup(
  idToken: string,
  name?: string,
  email?: string
): Promise<{ ok: boolean; accessToken?: string; refreshToken?: string; user?: User; reason?: string }> {
  const res = await fetch(`${API_BASE}/api/auth/firebase/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    },
    body: JSON.stringify({ name, email }),
  });
  const data = await res.json();
  if (data.accessToken) {
    safeWrite("lvigs.accessToken", data.accessToken);
    safeWrite("lvigs.refreshToken", data.refreshToken);
    if (data.user) safeWrite(USER_KEY, data.user);
  }
  return data;
}
