export type Money = number;

export type ID = string;

export interface Category {
  id: ID;
  slug: string;
  name: string;
  icon?: string;
  image?: string;
  parentId?: ID | null;
  order: number;
  featured?: boolean;
  subcategories?: Category[];
}

export interface Brand {
  id: ID;
  slug: string;
  name: string;
  logo?: string;
}

export interface ProductVariant {
  id: ID;
  productId: ID;
  sku: string;
  color?: string;
  size?: string;
  mrp: Money;
  price: Money;
  stock: number;
  images: string[];
}

export interface ProductAttributes {
  [key: string]: string | number | boolean;
}

export interface Product {
  id: ID;
  slug: string;
  title: string;
  brand: string;
  brandId: ID;
  categoryId: ID;
  subcategoryId?: ID;
  sellerId: ID;
  sellerName: string;
  description: string;
  highlights: string[];
  specifications: { label: string; value: string }[];
  rating: number;
  ratingCount: number;
  reviewCount: number;
  mrp: Money;
  price: Money;
  images: string[];
  videos?: string[];
  stock: number;
  warranty?: string;
  returnPolicy?: string;
  emi?: { monthly: number; tenureMonths: number }[];
  attributes?: ProductAttributes;
  variants?: ProductVariant[];
  deliveryCharge: Money;
  freeDelivery: boolean;
  fastDelivery: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isFlashDeal?: boolean;
  tags: string[];
  createdAt: string;
}

export interface CartItem {
  id: ID;
  productId: ID;
  variantId?: ID;
  quantity: number;
  product: Product;
  addedAt: string;
}

export interface CartTotals {
  itemCount: number;
  mrpTotal: Money;
  priceTotal: Money;
  itemDiscount: Money;
  couponDiscount: Money;
  deliveryFee: Money;
  freeDelivery: boolean;
  tax: Money;
  payable: Money;
  savings: Money;
}

export interface Address {
  id: ID;
  userId?: ID;
  label: "HOME" | "WORK" | "OTHER";
  name: string;
  mobile: string;
  pincode: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  isDefault?: boolean;
  lat?: number;
  lng?: number;
}

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export interface OrderItem {
  id: ID;
  productId: ID;
  variantId?: ID;
  title: string;
  image: string;
  quantity: number;
  price: Money;
  mrp: Money;
  status: OrderStatus;
}

export interface OrderTimeline {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: ID;
  shortId: string;
  userId: ID;
  items: OrderItem[];
  address: Address;
  payment: {
    method: "UPI" | "CARD" | "NETBANKING" | "WALLET" | "EMI" | "COD" | "PAYLATER";
    status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
    transactionId?: string;
  };
  totals: CartTotals;
  status: OrderStatus;
  timeline: OrderTimeline[];
  expectedDelivery: string;
  deliveredAt?: string;
  trackingId?: string;
  deliveryPartner?: {
    name: string;
    mobile: string;
    rating: number;
  };
  createdAt: string;
  invoiceUrl?: string;
}

export interface Review {
  id: ID;
  productId: ID;
  userId: ID;
  userName: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  verified: boolean;
  helpful: number;
  createdAt: string;
}

export interface Coupon {
  id: ID;
  code: string;
  description: string;
  type: "PERCENT" | "FLAT";
  value: number;
  maxDiscount?: Money;
  minOrder: Money;
  appliesTo: "ALL" | "CATEGORY" | "PRODUCT";
  scopeIds?: ID[];
  expiresAt: string;
  usageLimit?: number;
  usedCount: number;
  firstOrderOnly?: boolean;
  userSpecific?: boolean;
}

export interface Banner {
  id: ID;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  cta?: { label: string; href: string };
  ctaLabel?: string;
  ctaLink?: string;
  ctaText?: string;
  ctaUrl?: string;
  bg: string;
  fg: string;
  link?: string;
  sortOrder?: number;
}

export interface NotificationItem {
  id: ID;
  type: "ORDER" | "OFFER" | "PRICE" | "STOCK" | "ACCOUNT" | "SYSTEM";
  title: string;
  body: string;
  image?: string;
  read: boolean;
  at: string;
  link?: string;
}

export interface WishlistItem {
  id: ID;
  product: Product;
  addedAt: string;
}

export interface User {
  id: ID;
  name?: string;
  email?: string;
  mobile?: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
  joinedAt: string;
}

export interface SearchSuggestion {
  type: "PRODUCT" | "CATEGORY" | "BRAND" | "QUERY";
  text: string;
  payload?: Product | Category | Brand;
}

// ─── Loyalty ────────────────────────────────────────────────────────────────
export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface LoyaltyAccount {
  userId: ID;
  points: number;
  tier: LoyaltyTier;
  lifetimePoints: number;
  pointsExpiringSoon: number;
  expiresAt: string;
}

export interface LoyaltyTransaction {
  id: ID;
  userId: ID;
  type: "EARNED" | "REDEEMED" | "EXPIRED" | "ADJUSTED";
  points: number;
  description: string;
  orderId?: ID;
  createdAt: string;
}

// ─── Membership ─────────────────────────────────────────────────────────────
export interface MembershipPlan {
  id: ID;
  name: string;
  slug: string;
  price: number;
  period: "MONTHLY" | "YEARLY";
  features: string[];
  badge: string;
  color: string;
}

export interface MembershipSubscription {
  userId: ID;
  planId: ID;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

// ─── AI Assistant ───────────────────────────────────────────────────────────
export interface AiMessage {
  id: ID;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  timestamp: string;
}

export interface AiConversation {
  id: ID;
  userId?: ID;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── Price & Stock Alerts ───────────────────────────────────────────────────
export interface PriceAlert {
  id: ID;
  userId: ID;
  productId: ID;
  targetPrice: number;
  currentPrice: number;
  status: "ACTIVE" | "TRIGGERED" | "CANCELLED";
  createdAt: string;
}

export interface StockAlert {
  id: ID;
  userId: ID;
  productId: ID;
  status: "SUBSCRIBED" | "NOTIFIED" | "CANCELLED";
  createdAt: string;
}

// ─── Notifications ──────────────────────────────────────────────────────────
export interface NotificationPreference {
  userId: ID;
  category: "ORDER" | "OFFER" | "PRICE" | "STOCK" | "ACCOUNT" | "SYSTEM";
  push: boolean;
  email: boolean;
  sms: boolean;
}

// ─── Fraud & Config ─────────────────────────────────────────────────────────
export interface FraudRiskEvent {
  id: ID;
  userId: ID;
  type: "SUSPICIOUS_ORDER" | "PAYMENT_ANOMALY" | "ACCOUNT_ABUSE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  resolved: boolean;
  createdAt: string;
}

export interface SystemConfig {
  aiProvider: string;
  aiApiKeyConfigured: boolean;
  recommendationEnabled: boolean;
  loyaltyEnabled: boolean;
  membershipEnabled: boolean;
  fraudDetectionEnabled: boolean;
  fraudThreshold: number;
}

// ─── AR / 3D ────────────────────────────────────────────────────────────────
export interface ArAsset {
  productId: ID;
  modelUrl: string;
  format: "USDZ" | "GLB" | "GLTF";
  supported: boolean;
}

export interface Product3dModel {
  productId: ID;
  modelUrl: string;
  thumbnailUrl: string;
  autoRotate: boolean;
}

// ─── Language ───────────────────────────────────────────────────────────────
export type Locale = "en" | "hi";

export interface Translations {
  [key: string]: string;
}