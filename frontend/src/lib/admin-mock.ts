import type { Product, Category, Order, Coupon, User, OrderStatus } from "./types";
import { products as seedProducts, categories as seedCategories } from "./mock-data";
import { uuid } from "./utils";

export type KycStatus = "NOT_STARTED" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type SellerStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export interface SellerDocument {
  id: string;
  type: "PAN_CARD" | "GST_CERTIFICATE" | "AADHAAR" | "ADDRESS_PROOF" | "BANK_STATEMENT" | "BUSINESS_LICENSE";
  url: string;
  fileName: string;
  status: KycStatus;
  notes?: string;
  uploadedAt: string;
}

export interface AdminSeller {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  status: SellerStatus;
  kycStatus: KycStatus;
  rating: number;
  ratingCount: number;
  productCount: number;
  orderCount: number;
  totalRevenue: number;
  panNumber: string;
  gstNumber: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankAccount: { accountName: string; accountNumber: string; ifsc: string; bankName: string; upi?: string } | null;
  documents: SellerDocument[];
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
  topProducts: { product: Product; orderCount: number }[];
}

export interface AdminUser extends User {
  isBlocked: boolean;
  orderCount: number;
  totalSpent: number;
}

const LS_KEY = "lvigs_admin";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function safeWrite(key: string, value: unknown) {
  if (typeof window !== "undefined") {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
}

function getAllProducts(): Product[] {
  return safeRead("lvigs_products", seedProducts);
}
function getAllCategories(): Category[] {
  return safeRead("lvigs_categories", seedCategories);
}
function getAllOrders(): Order[] {
  return safeRead("lvigs_orders", []);
}
function getAllCoupons(): Coupon[] {
  return safeRead("lvigs_coupons", [
    { id: "c1", code: "WELCOME100", description: "₹100 OFF on first order", type: "FLAT", value: 100, minOrder: 499, appliesTo: "ALL", expiresAt: "2026-12-31", usedCount: 0, usageLimit: 10000, firstOrderOnly: true },
    { id: "c2", code: "LVIGS10", description: "10% OFF up to ₹200", type: "PERCENT", value: 10, maxDiscount: 200, minOrder: 999, appliesTo: "ALL", expiresAt: "2026-12-31", usedCount: 342, usageLimit: 5000 },
    { id: "c3", code: "FLAT50", description: "Flat ₹50 OFF", type: "FLAT", value: 50, minOrder: 299, appliesTo: "ALL", expiresAt: "2026-06-30", usedCount: 1200, usageLimit: 10000 },
    { id: "c4", code: "ELECTRONICS20", description: "20% OFF on Electronics", type: "PERCENT", value: 20, maxDiscount: 500, minOrder: 1999, appliesTo: "CATEGORY", scopeIds: ["cat-electronics"], expiresAt: "2026-12-31", usedCount: 89, usageLimit: 2000 },
  ]);
}
function getAllUsers(): AdminUser[] {
  const users = safeRead<AdminUser[]>("lvigs_admin_users", [
    { id: "u1", name: "Gopal Kumar", email: "gopal@example.com", mobile: "9876543210", role: "ADMIN", joinedAt: "2025-01-15", isBlocked: false, orderCount: 12, totalSpent: 45200 },
    { id: "u2", name: "Priya Sharma", email: "priya@example.com", mobile: "9876543211", role: "CUSTOMER", joinedAt: "2025-03-20", isBlocked: false, orderCount: 8, totalSpent: 23400 },
    { id: "u3", name: "Rahul Verma", email: "rahul@example.com", mobile: "9876543212", role: "CUSTOMER", joinedAt: "2025-04-10", isBlocked: false, orderCount: 15, totalSpent: 67800 },
    { id: "u4", name: "Anita Desai", email: "anita@example.com", mobile: "9876543213", role: "CUSTOMER", joinedAt: "2025-05-05", isBlocked: true, orderCount: 2, totalSpent: 3200 },
    { id: "u5", name: "Vikram Singh", email: "vikram@example.com", mobile: "9876543214", role: "SELLER", joinedAt: "2025-02-28", isBlocked: false, orderCount: 0, totalSpent: 0 },
    { id: "u6", name: "Neha Gupta", email: "neha@example.com", mobile: "9876543215", role: "CUSTOMER", joinedAt: "2025-06-12", isBlocked: false, orderCount: 5, totalSpent: 12900 },
    { id: "u7", name: "Amit Patel", email: "amit@example.com", mobile: "9876543216", role: "CUSTOMER", joinedAt: "2025-07-01", isBlocked: false, orderCount: 22, totalSpent: 89500 },
    { id: "u8", name: "Sneha Reddy", email: "sneha@example.com", mobile: "9876543217", role: "CUSTOMER", joinedAt: "2025-08-15", isBlocked: false, orderCount: 3, totalSpent: 5600 },
  ]);
  return users;
}

function generateSampleOrders(): Order[] {
  const now = Date.now();
  const day = 86400000;
  return [
    {
      id: "o1", shortId: "ORD-001", userId: "u2",
      items: [{ id: "oi1", productId: "p1", title: "iPhone 15 Pro Max", image: "https://placehold.co/100x100?text=iPhone", quantity: 1, price: 134900, mrp: 159900, status: "DELIVERED" }],
      address: { id: "a1", name: "Priya Sharma", mobile: "9876543211", pincode: "560001", line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", country: "IN", label: "HOME" },
      payment: { method: "UPI", status: "SUCCESS", transactionId: "TXN-UPI-001" },
      totals: { itemCount: 1, mrpTotal: 159900, priceTotal: 134900, itemDiscount: 25000, couponDiscount: 0, deliveryFee: 0, freeDelivery: true, tax: 0, payable: 134900, savings: 25000 },
      status: "DELIVERED", createdAt: new Date(now - 5 * day).toISOString(),
      timeline: [{ status: "PLACED", at: new Date(now - 5 * day).toISOString() }, { status: "CONFIRMED", at: new Date(now - 5 * day + 3600000).toISOString() }, { status: "PACKED", at: new Date(now - 4 * day).toISOString() }, { status: "SHIPPED", at: new Date(now - 3 * day).toISOString() }, { status: "DELIVERED", at: new Date(now - 1 * day).toISOString() }],
      expectedDelivery: new Date(now - 1 * day).toISOString(), deliveredAt: new Date(now - 1 * day).toISOString(),
    },
    {
      id: "o2", shortId: "ORD-002", userId: "u3",
      items: [{ id: "oi2", productId: "p5", title: "Samsung Galaxy S24 Ultra", image: "https://placehold.co/100x100?text=Samsung", quantity: 1, price: 129999, mrp: 149999, status: "SHIPPED" }],
      address: { id: "a2", name: "Rahul Verma", mobile: "9876543212", pincode: "110001", line1: "45 Connaught Place", city: "New Delhi", state: "Delhi", country: "IN", label: "WORK" },
      payment: { method: "CARD", status: "SUCCESS", transactionId: "TXN-CARD-002" },
      totals: { itemCount: 1, mrpTotal: 149999, priceTotal: 129999, itemDiscount: 20000, couponDiscount: 200, deliveryFee: 0, freeDelivery: true, tax: 0, payable: 129799, savings: 20200 },
      status: "SHIPPED", createdAt: new Date(now - 2 * day).toISOString(),
      timeline: [{ status: "PLACED", at: new Date(now - 2 * day).toISOString() }, { status: "CONFIRMED", at: new Date(now - 2 * day + 1800000).toISOString() }, { status: "PACKED", at: new Date(now - 1 * day).toISOString() }, { status: "SHIPPED", at: new Date(now - 12 * 3600000).toISOString() }],
      expectedDelivery: new Date(now + 1 * day).toISOString(), trackingId: "TRK-987654",
    },
    {
      id: "o3", shortId: "ORD-003", userId: "u6",
      items: [
        { id: "oi3", productId: "p8", title: "boAt Rockerz 450", image: "https://placehold.co/100x100?text=boAt", quantity: 2, price: 999, mrp: 2990, status: "CONFIRMED" },
        { id: "oi4", productId: "p12", title: "Noise ColorFit Pro 5", image: "https://placehold.co/100x100?text=Noise", quantity: 1, price: 3499, mrp: 5999, status: "CONFIRMED" },
      ],
      address: { id: "a3", name: "Neha Gupta", mobile: "9876543215", pincode: "400001", line1: "78 Andheri West", city: "Mumbai", state: "Maharashtra", country: "IN", label: "HOME" },
      payment: { method: "COD", status: "PENDING" },
      totals: { itemCount: 3, mrpTotal: 8980, priceTotal: 5497, itemDiscount: 3483, couponDiscount: 0, deliveryFee: 50, freeDelivery: false, tax: 275, payable: 5822, savings: 3483 },
      status: "CONFIRMED", createdAt: new Date(now - 1 * day).toISOString(),
      timeline: [{ status: "PLACED", at: new Date(now - 1 * day).toISOString() }, { status: "CONFIRMED", at: new Date(now - 20 * 3600000).toISOString() }],
      expectedDelivery: new Date(now + 3 * day).toISOString(),
    },
    {
      id: "o4", shortId: "ORD-004", userId: "u7",
      items: [{ id: "oi5", productId: "p3", title: "MacBook Air M3", image: "https://placehold.co/100x100?text=MacBook", quantity: 1, price: 114900, mrp: 129900, status: "PLACED" }],
      address: { id: "a4", name: "Amit Patel", mobile: "9876543216", pincode: "380001", line1: "12 CG Road", city: "Ahmedabad", state: "Gujarat", country: "IN", label: "HOME" },
      payment: { method: "NETBANKING", status: "PENDING" },
      totals: { itemCount: 1, mrpTotal: 129900, priceTotal: 114900, itemDiscount: 15000, couponDiscount: 200, deliveryFee: 0, freeDelivery: true, tax: 0, payable: 114700, savings: 15200 },
      status: "PLACED", createdAt: new Date(now - 4 * 3600000).toISOString(),
      timeline: [{ status: "PLACED", at: new Date(now - 4 * 3600000).toISOString() }],
      expectedDelivery: new Date(now + 5 * day).toISOString(),
    },
    {
      id: "o5", shortId: "ORD-005", userId: "u2",
      items: [{ id: "oi6", productId: "p15", title: "Sony WH-1000XM5", image: "https://placehold.co/100x100?text=Sony", quantity: 1, price: 26990, mrp: 34990, status: "CANCELLED" }],
      address: { id: "a5", name: "Priya Sharma", mobile: "9876543211", pincode: "560001", line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", country: "IN", label: "HOME" },
      payment: { method: "UPI", status: "REFUNDED", transactionId: "TXN-UPI-005" },
      totals: { itemCount: 1, mrpTotal: 34990, priceTotal: 26990, itemDiscount: 8000, couponDiscount: 0, deliveryFee: 0, freeDelivery: true, tax: 0, payable: 26990, savings: 8000 },
      status: "CANCELLED", createdAt: new Date(now - 7 * day).toISOString(),
      timeline: [{ status: "PLACED", at: new Date(now - 7 * day).toISOString() }, { status: "CANCELLED", at: new Date(now - 6 * day).toISOString(), note: "Customer requested cancellation" }],
      expectedDelivery: new Date(now - 3 * day).toISOString(),
    },
  ];
}

function getSampleOrders(): Order[] {
  const stored = safeRead<Order[]>("lvigs_orders", []);
  if (stored.length > 0) return stored;
  const sample = generateSampleOrders();
  safeWrite("lvigs_orders", sample);
  return sample;
}

function getDefaultSellers(): AdminSeller[] {
  return [
    {
      id: "s1", userId: "u5", storeName: "TechNova Electronics", slug: "technova",
      description: "Premium electronics and gadgets store", logo: "https://placehold.co/100x100?text=TN",
      banner: "https://placehold.co/1200x300?text=TechNova", status: "ACTIVE", kycStatus: "APPROVED",
      rating: 4.3, ratingCount: 189, productCount: 45, orderCount: 312, totalRevenue: 2845000,
      panNumber: "BZFPS1234G", gstNumber: "27BZFPS1234G1Z8",
      ownerName: "Vikram Singh", ownerEmail: "vikram@technova.com", ownerMobile: "9876543214",
      businessType: "PRIVATE_LIMITED", address: "45 Andheri Kurla Road", city: "Mumbai",
      state: "Maharashtra", pincode: "400058",
      bankAccount: { accountName: "TechNova Electronics Pvt Ltd", accountNumber: "9876543210", ifsc: "HDFC0001234", bankName: "HDFC Bank" },
      documents: [
        { id: "d1", type: "PAN_CARD", url: "https://placehold.co/800x500?text=PAN+Card", fileName: "pan_card.pdf", status: "APPROVED", uploadedAt: "2025-02-28" },
        { id: "d2", type: "GST_CERTIFICATE", url: "https://placehold.co/800x500?text=GST+Cert", fileName: "gst_cert.pdf", status: "APPROVED", uploadedAt: "2025-02-28" },
        { id: "d3", type: "AADHAAR", url: "https://placehold.co/800x500?text=Aadhaar", fileName: "aadhaar.pdf", status: "APPROVED", uploadedAt: "2025-02-28" },
      ],
      createdAt: "2025-02-28", reviewedAt: "2025-03-01",
    },
    {
      id: "s2", userId: "u-s2", storeName: "FashionHub India", slug: "fashionhub",
      description: "Trendy fashion for men and women", logo: "https://placehold.co/100x100?text=FH",
      banner: "https://placehold.co/1200x300?text=FashionHub", status: "PENDING", kycStatus: "SUBMITTED",
      rating: 0, ratingCount: 0, productCount: 0, orderCount: 0, totalRevenue: 0,
      panNumber: "CWTPQ5678H", gstNumber: "",
      ownerName: "Priya Mehra", ownerEmail: "priya@fashionhub.in", ownerMobile: "9876543220",
      businessType: "INDIVIDUAL", address: "12 Lajpat Nagar Market", city: "New Delhi",
      state: "Delhi", pincode: "110024",
      bankAccount: { accountName: "Priya Mehra", accountNumber: "5678901234", ifsc: "ICIC0005678", bankName: "ICICI Bank" },
      documents: [
        { id: "d4", type: "PAN_CARD", url: "https://placehold.co/800x500?text=PAN+Card", fileName: "pan_card.pdf", status: "SUBMITTED", uploadedAt: "2026-09-01" },
        { id: "d5", type: "AADHAAR", url: "https://placehold.co/800x500?text=Aadhaar", fileName: "aadhaar.pdf", status: "SUBMITTED", uploadedAt: "2026-09-01" },
        { id: "d6", type: "ADDRESS_PROOF", url: "https://placehold.co/800x500?text=Address+Proof", fileName: "address_proof.pdf", status: "SUBMITTED", uploadedAt: "2026-09-02" },
      ],
      createdAt: "2026-09-01",
    },
    {
      id: "s3", userId: "u-s3", storeName: "GreenLeaf Organics", slug: "greenleaf",
      description: "100% organic food and wellness products", logo: "https://placehold.co/100x100?text=GL",
      banner: "https://placehold.co/1200x300?text=GreenLeaf", status: "PENDING", kycStatus: "SUBMITTED",
      rating: 0, ratingCount: 0, productCount: 0, orderCount: 0, totalRevenue: 0,
      panNumber: "AGFPS9012J", gstNumber: "29AGFPS9012J1Z3",
      ownerName: "Arjun Nair", ownerEmail: "arjun@greenleaf.co", ownerMobile: "9876543221",
      businessType: "PARTNERSHIP", address: "78 MG Road, Indiranagar", city: "Bengaluru",
      state: "Karnataka", pincode: "560038",
      bankAccount: { accountName: "GreenLeaf Organics", accountNumber: "3456789012", ifsc: "SBIN0003456", bankName: "State Bank of India" },
      documents: [
        { id: "d7", type: "PAN_CARD", url: "https://placehold.co/800x500?text=PAN+Card", fileName: "pan_card.pdf", status: "SUBMITTED", uploadedAt: "2026-08-28" },
        { id: "d8", type: "GST_CERTIFICATE", url: "https://placehold.co/800x500?text=GST+Cert", fileName: "gst_cert.pdf", status: "SUBMITTED", uploadedAt: "2026-08-28" },
        { id: "d9", type: "BUSINESS_LICENSE", url: "https://placehold.co/800x500?text=License", fileName: "business_license.pdf", status: "SUBMITTED", uploadedAt: "2026-08-29" },
        { id: "d10", type: "BANK_STATEMENT", url: "https://placehold.co/800x500?text=Bank+Statement", fileName: "bank_statement.pdf", status: "SUBMITTED", uploadedAt: "2026-08-29" },
      ],
      createdAt: "2026-08-28",
    },
    {
      id: "s4", userId: "u-s4", storeName: "Urban Style Co", slug: "urbanstyle",
      description: "Streetwear and urban fashion", logo: "https://placehold.co/100x100?text=US",
      banner: "https://placehold.co/1200x300?text=UrbanStyle", status: "REJECTED", kycStatus: "REJECTED",
      rating: 0, ratingCount: 0, productCount: 0, orderCount: 0, totalRevenue: 0,
      panNumber: "DKFPS3456K", gstNumber: "",
      ownerName: "Deepak Kumar", ownerEmail: "deepak@urbanstyle.in", ownerMobile: "9876543222",
      businessType: "INDIVIDUAL", address: "23 Nehru Place", city: "New Delhi",
      state: "Delhi", pincode: "110019",
      bankAccount: null,
      documents: [
        { id: "d11", type: "PAN_CARD", url: "https://placehold.co/800x500?text=PAN+Card", fileName: "pan_card.pdf", status: "REJECTED", notes: "PAN number is invalid", uploadedAt: "2026-08-15" },
        { id: "d12", type: "AADHAAR", url: "https://placehold.co/800x500?text=Aadhaar", fileName: "aadhaar.pdf", status: "REJECTED", notes: "Document is blurry and unreadable", uploadedAt: "2026-08-15" },
      ],
      rejectionReason: "PAN number is invalid and Aadhaar document is blurry. Please re-submit with valid documents.",
      createdAt: "2026-08-15", reviewedAt: "2026-08-17",
    },
    {
      id: "s5", userId: "u-s5", storeName: "HomeDecor Luxe", slug: "homedecor",
      description: "Premium home decor and furnishings", logo: "https://placehold.co/100x100?text=HD",
      banner: "https://placehold.co/1200x300?text=HomeDecor", status: "PENDING", kycStatus: "NOT_STARTED",
      rating: 0, ratingCount: 0, productCount: 0, orderCount: 0, totalRevenue: 0,
      panNumber: "", gstNumber: "",
      ownerName: "Sneha Agarwal", ownerEmail: "sneha@homedecor.in", ownerMobile: "9876543223",
      businessType: "INDIVIDUAL", address: "56 Koramangala 4th Block", city: "Bengaluru",
      state: "Karnataka", pincode: "560034",
      bankAccount: null,
      documents: [],
      createdAt: "2026-09-05",
    },
    {
      id: "s6", userId: "u-s6", storeName: "FitGear Sports", slug: "fitgear",
      description: "Sports equipment and fitness gear", logo: "https://placehold.co/100x100?text=FG",
      banner: "https://placehold.co/1200x300?text=FitGear", status: "SUSPENDED", kycStatus: "APPROVED",
      rating: 2.8, ratingCount: 45, productCount: 12, orderCount: 28, totalRevenue: 156000,
      panNumber: "AJTPP7890L", gstNumber: "24AJTPP7890L1Z1",
      ownerName: "Rohit Sharma", ownerEmail: "rohit@fitgear.in", ownerMobile: "9876543224",
      businessType: "PRIVATE_LIMITED", address: "89 Parel Highway", city: "Mumbai",
      state: "Maharashtra", pincode: "400013",
      bankAccount: { accountName: "FitGear Sports Pvt Ltd", accountNumber: "7890123456", ifsc: "KKBK0007890", bankName: "Kotak Mahindra Bank" },
      documents: [
        { id: "d13", type: "PAN_CARD", url: "https://placehold.co/800x500?text=PAN+Card", fileName: "pan_card.pdf", status: "APPROVED", uploadedAt: "2025-06-10" },
        { id: "d14", type: "GST_CERTIFICATE", url: "https://placehold.co/800x500?text=GST+Cert", fileName: "gst_cert.pdf", status: "APPROVED", uploadedAt: "2025-06-10" },
      ],
      rejectionReason: "Suspended due to multiple customer complaints about counterfeit products.",
      createdAt: "2025-06-10", reviewedAt: "2025-06-12",
    },
  ];
}

export const adminMock = {
  getDashboardStats(): AdminDashboardStats {
    const products = getAllProducts();
    const orders = getSampleOrders();
    const users = getAllUsers();
    const totalRevenue = orders.filter(o => o.payment.status === "SUCCESS").reduce((s, o) => s + o.totals.payable, 0);
    const topProducts = products.slice(0, 5).map(p => ({ product: p, orderCount: Math.floor(Math.random() * 50) + 5 })).sort((a, b) => b.orderCount - a.orderCount);
    return { totalUsers: users.length, totalProducts: products.length, totalOrders: orders.length, totalRevenue, recentOrders: orders.slice(0, 5), topProducts };
  },

  getProducts(): Product[] { return getAllProducts(); },
  getProduct(id: string): Product | undefined { return getAllProducts().find(p => p.id === id); },

  addProduct(data: Omit<Product, "id" | "slug" | "createdAt" | "rating" | "ratingCount" | "reviewCount">): Product {
    const products = getAllProducts();
    const p: Product = { ...data, id: uuid(), slug: data.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"), rating: 0, ratingCount: 0, reviewCount: 0, createdAt: new Date().toISOString() };
    products.unshift(p);
    safeWrite("lvigs_products", products);
    return p;
  },

  updateProduct(id: string, data: Partial<Product>): Product | undefined {
    const products = getAllProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx < 0) return undefined;
    products[idx] = { ...products[idx], ...data };
    safeWrite("lvigs_products", products);
    return products[idx];
  },

  deleteProduct(id: string): boolean {
    const products = getAllProducts().filter(p => p.id !== id);
    safeWrite("lvigs_products", products);
    return true;
  },

  getCategories(): Category[] { return getAllCategories(); },
  addCategory(data: Omit<Category, "id" | "order">): Category {
    const cats = getAllCategories();
    const c: Category = { ...data, id: uuid(), order: cats.length + 1 };
    cats.push(c);
    safeWrite("lvigs_categories", cats);
    return c;
  },
  updateCategory(id: string, data: Partial<Category>): Category | undefined {
    const cats = getAllCategories();
    const idx = cats.findIndex(c => c.id === id);
    if (idx < 0) return undefined;
    cats[idx] = { ...cats[idx], ...data };
    safeWrite("lvigs_categories", cats);
    return cats[idx];
  },
  deleteCategory(id: string): boolean {
    const cats = getAllCategories().filter(c => c.id !== id);
    safeWrite("lvigs_categories", cats);
    return true;
  },

  getOrders(): Order[] { return getSampleOrders(); },
  getOrder(id: string): Order | undefined { return getSampleOrders().find(o => o.id === id || o.shortId === id); },
  updateOrderStatus(id: string, status: OrderStatus): Order | undefined {
    const orders = getSampleOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx < 0) return undefined;
    orders[idx].status = status;
    orders[idx].timeline.push({ status, at: new Date().toISOString() });
    if (status === "DELIVERED") orders[idx].deliveredAt = new Date().toISOString();
    safeWrite("lvigs_orders", orders);
    return orders[idx];
  },

  getCoupons(): Coupon[] { return getAllCoupons(); },
  addCoupon(data: Omit<Coupon, "id" | "usedCount">): Coupon {
    const coupons = getAllCoupons();
    const c: Coupon = { ...data, id: uuid(), usedCount: 0 };
    coupons.push(c);
    safeWrite("lvigs_coupons", coupons);
    return c;
  },
  updateCoupon(id: string, data: Partial<Coupon>): Coupon | undefined {
    const coupons = getAllCoupons();
    const idx = coupons.findIndex(c => c.id === id);
    if (idx < 0) return undefined;
    coupons[idx] = { ...coupons[idx], ...data };
    safeWrite("lvigs_coupons", coupons);
    return coupons[idx];
  },
  deleteCoupon(id: string): boolean {
    const coupons = getAllCoupons().filter(c => c.id !== id);
    safeWrite("lvigs_coupons", coupons);
    return true;
  },

  getUsers(): AdminUser[] { return getAllUsers(); },
  toggleUserBlock(id: string, blocked: boolean): AdminUser | undefined {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx < 0) return undefined;
    users[idx].isBlocked = blocked;
    safeWrite("lvigs_admin_users", users);
    return users[idx];
  },

  getSellers(): AdminSeller[] {
    return safeRead<AdminSeller[]>("lvigs_admin_sellers", getDefaultSellers());
  },
  getSeller(id: string): AdminSeller | undefined {
    return this.getSellers().find(s => s.id === id);
  },
  approveSeller(id: string): AdminSeller | undefined {
    const sellers = this.getSellers();
    const idx = sellers.findIndex(s => s.id === id);
    if (idx < 0) return undefined;
    sellers[idx].status = "ACTIVE";
    sellers[idx].kycStatus = "APPROVED";
    sellers[idx].documents = sellers[idx].documents.map(d => ({ ...d, status: "APPROVED" as KycStatus }));
    sellers[idx].reviewedAt = new Date().toISOString();
    sellers[idx].rejectionReason = undefined;
    safeWrite("lvigs_admin_sellers", sellers);
    return sellers[idx];
  },
  rejectSeller(id: string, reason: string): AdminSeller | undefined {
    const sellers = this.getSellers();
    const idx = sellers.findIndex(s => s.id === id);
    if (idx < 0) return undefined;
    sellers[idx].status = "REJECTED";
    sellers[idx].kycStatus = "REJECTED";
    sellers[idx].documents = sellers[idx].documents.map(d => ({ ...d, status: "REJECTED" as KycStatus, notes: reason }));
    sellers[idx].rejectionReason = reason;
    sellers[idx].reviewedAt = new Date().toISOString();
    safeWrite("lvigs_admin_sellers", sellers);
    return sellers[idx];
  },
  suspendSeller(id: string): AdminSeller | undefined {
    const sellers = this.getSellers();
    const idx = sellers.findIndex(s => s.id === id);
    if (idx < 0) return undefined;
    sellers[idx].status = "SUSPENDED";
    safeWrite("lvigs_admin_sellers", sellers);
    return sellers[idx];
  },
};
