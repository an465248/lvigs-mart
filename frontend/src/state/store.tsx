"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, CartTotals, User, LoyaltyAccount, LoyaltyTier, Locale } from "@/lib/types";
import { mockApi } from "@/lib/api";

interface StoreState {
  cart: CartItem[];
  cartTotals: CartTotals;
  cartCount: number;
  wishlistIds: Set<string>;
  wishlistCount: number;
  user: User | null;
  notifUnreadCount: number;
  loyalty: LoyaltyAccount | null;
  membership: { planId: string; status: string } | null;
  locale: Locale;
}

interface StoreActions {
  addToCart: (productId: string, qty?: number) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  removeCartItem: (itemId: string) => void;
  clearCart: () => void;
  refreshTotals: (coupon?: string) => void;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isWishlisted: (productId: string) => boolean;
  setUser: (user: User | null) => void;
  setAuthTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  coupon?: string;
  applyCoupon: (code?: string) => void;
  setLocale: (locale: Locale) => void;
}

interface StoreContextValue extends StoreState, StoreActions {}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [user, setUserState] = useState<User | null>(null);
  const [coupon, setCoupon] = useState<string | undefined>(undefined);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [membership, setMembership] = useState<{ planId: string; status: string } | null>(null);
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setCart(mockApi.getCart());
    setWishlistIds(new Set(mockApi.getWishlist().map((w) => w.product.id)));
    setUserState(mockApi.getUser());
    setNotifUnreadCount(mockApi.getNotifications().filter((n) => !n.read).length);

    // Hydrate from real API in background
    (async () => {
      try {
        const [apiCart, apiWishlist, apiNotifs] = await Promise.allSettled([
          mockApi.getCartFromApi(),
          mockApi.getWishlistFromApi(),
          mockApi.getNotificationsFromApi(),
        ]);
        if (apiCart.status === "fulfilled" && apiCart.value.length > 0) {
          setCart(apiCart.value);
          mockApi.saveCart(apiCart.value);
        }
        if (apiWishlist.status === "fulfilled") {
          setWishlistIds(new Set(apiWishlist.value.map((w) => w.product.id)));
          mockApi.saveWishlist(apiWishlist.value);
        }
        if (apiNotifs.status === "fulfilled") {
          setNotifUnreadCount(apiNotifs.value.filter((n) => !n.read).length);
          mockApi.saveNotifications(apiNotifs.value);
        }
      } catch {}
    })();

    try {
      const storedLocale = localStorage.getItem("lvigs.locale") as Locale | null;
      if (storedLocale === "en" || storedLocale === "hi") setLocaleState(storedLocale);
    } catch {}

    try {
      const storedLoyalty = localStorage.getItem("lvigs.loyalty");
      if (storedLoyalty) setLoyalty(JSON.parse(storedLoyalty));
      else {
        const defaultLoyalty: LoyaltyAccount = {
          userId: "u-default",
          points: 2450,
          tier: "SILVER",
          lifetimePoints: 8200,
          pointsExpiringSoon: 350,
          expiresAt: new Date(Date.now() + 90 * 86400_000).toISOString(),
        };
        setLoyalty(defaultLoyalty);
        localStorage.setItem("lvigs.loyalty", JSON.stringify(defaultLoyalty));
      }
    } catch {}

    try {
      const storedMembership = localStorage.getItem("lvigs.membership");
      if (storedMembership) setMembership(JSON.parse(storedMembership));
    } catch {}

    const onCart = () => setCart(mockApi.getCart());
    const onWishlist = () => setWishlistIds(new Set(mockApi.getWishlist().map((w) => w.product.id)));
    const onUser = () => setUserState(mockApi.getUser());
    const onNotif = () => setNotifUnreadCount(mockApi.getNotifications().filter((n) => !n.read).length);
    const onAddr = () => {};
    const onOrders = () => {};

    window.addEventListener("lvigs:cart-change", onCart);
    window.addEventListener("lvigs:wishlist-change", onWishlist);
    window.addEventListener("lvigs:user-change", onUser);
    window.addEventListener("lvigs:notifications-change", onNotif);
    window.addEventListener("lvigs:addresses-change", onAddr);
    window.addEventListener("lvigs:orders-change", onOrders);

    return () => {
      window.removeEventListener("lvigs:cart-change", onCart);
      window.removeEventListener("lvigs:wishlist-change", onWishlist);
      window.removeEventListener("lvigs:user-change", onUser);
      window.removeEventListener("lvigs:notifications-change", onNotif);
      window.removeEventListener("lvigs:addresses-change", onAddr);
      window.removeEventListener("lvigs:orders-change", onOrders);
    };
  }, []);

  const cartTotals = useMemo(() => mockApi.computeTotals(cart, coupon), [cart, coupon]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const wishlistCount = wishlistIds.size;

  const addToCart = useCallback(async (productId: string, qty = 1) => {
    await mockApi.addToCart(productId, qty);
    setCart(mockApi.getCart());
  }, []);
  const updateCartItem = useCallback(async (itemId: string, quantity: number) => {
    await mockApi.updateCartItem(itemId, quantity);
    setCart(mockApi.getCart());
  }, []);
  const removeCartItem = useCallback(async (itemId: string) => {
    await mockApi.removeCartItem(itemId);
    setCart(mockApi.getCart());
  }, []);
  const clearCart = useCallback(async () => {
    await mockApi.clearCart();
    setCart([]);
  }, []);
  const refreshTotals = useCallback((c?: string) => setCoupon(c), []);

  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    const result = await mockApi.toggleWishlist(productId);
    const items = await mockApi.getWishlistFromApi().catch(() => mockApi.getWishlist());
    setWishlistIds(new Set(items.map((w) => w.product.id)));
    mockApi.saveWishlist(items);
    return result;
  }, []);
  const isWishlisted = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  const setUser = useCallback((u: User | null) => {
    mockApi.setUser(u);
    setUserState(u);
  }, []);

  const setAuthTokens = useCallback((accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem("lvigs.accessToken", accessToken);
      localStorage.setItem("lvigs.refreshToken", refreshToken);
    } catch {}
  }, []);

  const logout = useCallback(() => {
    mockApi.setUser(null);
    setUserState(null);
    mockApi.saveCart([]);
    mockApi.saveWishlist([]);
    mockApi.saveNotifications([]);
    setCart([]);
    setWishlistIds(new Set());
    setNotifUnreadCount(0);
    try {
      localStorage.removeItem("lvigs.accessToken");
      localStorage.removeItem("lvigs.refreshToken");
    } catch {}
  }, []);

  const applyCoupon = useCallback((code?: string) => setCoupon(code), []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem("lvigs.locale", l); } catch {}
  }, []);

  const value: StoreContextValue = {
    cart,
    cartTotals,
    cartCount,
    wishlistIds,
    wishlistCount,
    user,
    notifUnreadCount,
    loyalty,
    membership,
    locale,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refreshTotals,
    toggleWishlist,
    isWishlisted,
    setUser,
    setAuthTokens,
    logout,
    coupon,
    applyCoupon,
    setLocale,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}