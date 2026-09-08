import type { Product, Order, Coupon } from "./types";
import { products as seedProducts } from "./mock-data";
import { uuid } from "./utils";

export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  kycStatus: "NOT_STARTED" | "SUBMITTED" | "APPROVED" | "REJECTED";
  rating: number;
  ratingCount: number;
  productCount: number;
  panNumber: string;
  gstNumber: string;
  bankAccount: { accountName: string; accountNumber: string; ifsc: string; bankName: string; upi?: string } | null;
  createdAt: string;
}

export interface SellerProduct extends Product {
  approvalStatus: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED";
  rejectionReason?: string;
  sellerSku: string;
  sellerStock: number;
  sellerPrice: number;
  sellerMrp: number;
}

export interface SellerOrder {
  id: string;
  shortId: string;
  customerName: string;
  customerMobile: string;
  items: { title: string; image: string; quantity: number; price: number; mrp: number }[];
  total: number;
  status: "NEW" | "ACCEPTED" | "PACKING" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
  address: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
}

export interface SellerShipment {
  id: string;
  orderId: string;
  shortId: string;
  trackingId: string;
  status: string;
  partner: string;
  estimatedDelivery: string;
  createdAt: string;
}

export interface SellerInventory {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  totalStock: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  lastUpdated: string;
}

const SELLER_KEY = "lvigs_seller_auth";
const SELLER_PROFILE_KEY = "lvigs_seller_profile";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function safeWrite(key: string, value: unknown) {
  if (typeof window !== "undefined") {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
}

function getDefaultSeller(): SellerProfile {
  return {
    id: "seller-1",
    userId: "u-seller-1",
    storeName: "LVIGS Official Store",
    slug: "lvigs-official",
    description: "Official LVIGS Mart storefront",
    logo: "https://placehold.co/100x100?text=LVIGS",
    banner: "https://placehold.co/1200x300?text=LVIGS+Official+Store",
    status: "ACTIVE",
    kycStatus: "APPROVED",
    rating: 4.5,
    ratingCount: 342,
    productCount: 24,
    panNumber: "ABCDE1234F",
    gstNumber: "29ABCDE1234F1Z5",
    bankAccount: { accountName: "LVIGS Commerce Pvt. Ltd.", accountNumber: "1234567890", ifsc: "SBIN0001234", bankName: "State Bank of India", upi: "lvigs@upi" },
    createdAt: "2025-01-15",
  };
}

function getDefaultSellerProducts(): SellerProduct[] {
  return seedProducts.slice(0, 12).map((p, i) => ({
    ...p,
    sellerId: "seller-1",
    sellerName: "LVIGS Official Store",
    approvalStatus: i < 8 ? "PUBLISHED" : i < 10 ? "APPROVED" : "DRAFT" as any,
    sellerSku: `LVIGS-${String(i + 1).padStart(4, "0")}`,
    sellerStock: Math.floor(Math.random() * 100) + 10,
    sellerPrice: p.price,
    sellerMrp: p.mrp,
  }));
}

function getDefaultSellerOrders(): SellerOrder[] {
  const now = Date.now();
  const day = 86400000;
  return [
    {
      id: "so1", shortId: "ORD-001", customerName: "Priya Sharma", customerMobile: "9876543211",
      items: [{ title: "iPhone 15 Pro Max", image: "https://placehold.co/100x100?text=iPhone", quantity: 1, price: 134900, mrp: 159900 }],
      total: 134900, status: "DELIVERED", address: "12 MG Road, Bengaluru - 560001", createdAt: new Date(now - 5 * day).toISOString(), paymentMethod: "UPI", paymentStatus: "SUCCESS",
    },
    {
      id: "so2", shortId: "ORD-002", customerName: "Rahul Verma", customerMobile: "9876543212",
      items: [{ title: "Samsung Galaxy S24 Ultra", image: "https://placehold.co/100x100?text=Samsung", quantity: 1, price: 129999, mrp: 149999 }],
      total: 129999, status: "SHIPPED", address: "45 CP, New Delhi - 110001", createdAt: new Date(now - 2 * day).toISOString(), paymentMethod: "CARD", paymentStatus: "SUCCESS",
    },
    {
      id: "so3", shortId: "ORD-003", customerName: "Neha Gupta", customerMobile: "9876543215",
      items: [
        { title: "boAt Rockerz 450", image: "https://placehold.co/100x100?text=boAt", quantity: 2, price: 999, mrp: 2990 },
        { title: "Noise ColorFit Pro 5", image: "https://placehold.co/100x100?text=Noise", quantity: 1, price: 3499, mrp: 5999 },
      ],
      total: 5497, status: "PACKING", address: "78 Andheri West, Mumbai - 400001", createdAt: new Date(now - 1 * day).toISOString(), paymentMethod: "COD", paymentStatus: "PENDING",
    },
    {
      id: "so4", shortId: "ORD-004", customerName: "Amit Patel", customerMobile: "9876543216",
      items: [{ title: "MacBook Air M3", image: "https://placehold.co/100x100?text=MacBook", quantity: 1, price: 114900, mrp: 129900 }],
      total: 114900, status: "NEW", address: "12 CG Road, Ahmedabad - 380001", createdAt: new Date(now - 4 * 3600000).toISOString(), paymentMethod: "NETBANKING", paymentStatus: "PENDING",
    },
  ];
}

function getDefaultInventory(): SellerInventory[] {
  return getDefaultSellerProducts().slice(0, 8).map(p => ({
    id: `inv-${p.id}`,
    productId: p.id,
    productName: p.title,
    productImage: p.images[0] || "",
    sku: p.sellerSku,
    totalStock: p.sellerStock,
    reserved: Math.floor(Math.random() * 5),
    available: p.sellerStock - Math.floor(Math.random() * 5),
    lowStockThreshold: 5,
    lastUpdated: new Date().toISOString(),
  }));
}

export const sellerAuth = {
  isLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SELLER_KEY) === "true";
  },
  login() { localStorage.setItem(SELLER_KEY, "true"); },
  logout() { localStorage.removeItem(SELLER_KEY); },
};

export const sellerMock = {
  getProfile(): SellerProfile {
    return safeRead(SELLER_PROFILE_KEY, getDefaultSeller());
  },
  updateProfile(data: Partial<SellerProfile>): SellerProfile {
    const profile = { ...this.getProfile(), ...data };
    safeWrite(SELLER_PROFILE_KEY, profile);
    return profile;
  },

  getDashboard() {
    const orders = this.getOrders();
    const products = this.getProducts();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayOrders = orders.filter(o => new Date(o.createdAt).getTime() >= todayStart);
    const pendingOrders = orders.filter(o => ["NEW", "ACCEPTED", "PACKING"].includes(o.status));
    const totalRevenue = orders.filter(o => o.paymentStatus === "SUCCESS").reduce((s, o) => s + o.total, 0);
    const todaySales = todayOrders.filter(o => o.paymentStatus === "SUCCESS").reduce((s, o) => s + o.total, 0);
    const lowStockProducts = products.filter(p => p.sellerStock <= 5);

    return {
      stats: {
        todaySales,
        totalSales: totalRevenue,
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        totalProducts: products.length,
        lowStockProducts: lowStockProducts.length,
        returns: orders.filter(o => o.status === "RETURNED").length,
        earnings: totalRevenue * 0.9,
        pendingSettlement: totalRevenue * 0.1,
      },
      recentOrders: orders.slice(0, 5),
      topProducts: products.slice(0, 5),
    };
  },

  getProducts(): SellerProduct[] {
    return safeRead("lvigs_seller_products", getDefaultSellerProducts());
  },

  addProduct(data: Partial<SellerProduct>): SellerProduct {
    const products = this.getProducts();
    const p: SellerProduct = {
      ...data as any,
      id: uuid(),
      slug: (data.title || "product").toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"),
      approvalStatus: "DRAFT",
      sellerSku: `LVIGS-${String(products.length + 1).padStart(4, "0")}`,
      createdAt: new Date().toISOString(),
    };
    products.unshift(p);
    safeWrite("lvigs_seller_products", products);
    return p;
  },

  updateProduct(id: string, data: Partial<SellerProduct>): SellerProduct | undefined {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx < 0) return undefined;
    products[idx] = { ...products[idx], ...data };
    safeWrite("lvigs_seller_products", products);
    return products[idx];
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts().filter(p => p.id !== id);
    safeWrite("lvigs_seller_products", products);
    return true;
  },

  submitProduct(id: string): SellerProduct | undefined {
    return this.updateProduct(id, { approvalStatus: "SUBMITTED" });
  },

  getOrders(): SellerOrder[] {
    return safeRead("lvigs_seller_orders", getDefaultSellerOrders());
  },

  updateOrderStatus(id: string, status: SellerOrder["status"]): SellerOrder | undefined {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx < 0) return undefined;
    orders[idx].status = status;
    safeWrite("lvigs_seller_orders", orders);
    return orders[idx];
  },

  getInventory(): SellerInventory[] {
    return safeRead("lvigs_seller_inventory", getDefaultInventory());
  },

  updateInventory(id: string, data: Partial<SellerInventory>): SellerInventory | undefined {
    const inv = this.getInventory();
    const idx = inv.findIndex(i => i.id === id);
    if (idx < 0) return undefined;
    inv[idx] = { ...inv[idx], ...data, lastUpdated: new Date().toISOString() };
    inv[idx].available = inv[idx].totalStock - inv[idx].reserved;
    safeWrite("lvigs_seller_inventory", inv);
    return inv[idx];
  },

  getReturns() {
    return [
      { id: "r1", orderId: "ORD-001", customerName: "Priya Sharma", productTitle: "iPhone 15 Pro Max", reason: "Defective product", status: "REQUESTED", createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "r2", orderId: "ORD-005", customerName: "Vikram Singh", productTitle: "Sony WH-1000XM5", reason: "Changed mind", status: "APPROVED", createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    ];
  },
};
