import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [users, sellers, activeSellers, pendingSellers, products, pendingProducts, orders, todayOrders, revenue, platformCommission, pendingPayouts, returns, refunds] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.seller.count(),
      this.prisma.seller.count({ where: { status: "ACTIVE" } }),
      this.prisma.seller.count({ where: { status: "PENDING" } }),
      this.prisma.product.count({ where: { isApproved: true } }),
      this.prisma.productApproval.count({ where: { status: "SUBMITTED" } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      this.prisma.order.aggregate({ where: { paymentStatus: "SUCCESS" }, _sum: { total: true } }),
      this.prisma.sellerCommission.aggregate({ where: { status: "PENDING" }, _sum: { commissionAmt: true } }),
      this.prisma.sellerPayout.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
      this.prisma.returnRequest.count({ where: { status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED"] } } }),
      this.prisma.refund.aggregate({ where: { status: { in: ["INITIATED", "PROCESSING"] } }, _sum: { amount: true } }),
    ]);

    return {
      users,
      sellers,
      activeSellers,
      pendingSellers,
      products,
      pendingProducts,
      orders,
      todayOrders,
      revenue: revenue._sum.total || 0,
      platformCommission: platformCommission._sum.commissionAmt || 0,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      returns,
      refunds: refunds._sum.amount || 0,
    };
  }

  async getDailySalesChart(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since }, paymentStatus: "SUCCESS" },
      select: { createdAt: true, total: true },
    });

    const dailyData: Record<string, { sales: number; orders: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000);
      const key = d.toISOString().split("T")[0];
      dailyData[key] = { sales: 0, orders: 0 };
    }

    for (const o of orders) {
      const key = o.createdAt.toISOString().split("T")[0];
      if (dailyData[key]) {
        dailyData[key].sales += o.total;
        dailyData[key].orders += 1;
      }
    }

    return Object.entries(dailyData).map(([date, data]) => ({ date, ...data }));
  }

  async getTopCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          select: { soldCount: true, price: true },
        },
      },
    });

    return categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        totalSold: c.products.reduce((s, p) => s + p.soldCount, 0),
        totalRevenue: c.products.reduce((s, p) => s + p.soldCount * p.price, 0),
        productCount: c.products.length,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);
  }

  async getTopProducts() {
    return this.prisma.product.findMany({
      where: { isApproved: true, isActive: true },
      orderBy: { soldCount: "desc" },
      take: 10,
      select: { id: true, title: true, slug: true, price: true, soldCount: true, rating: true, images: { take: 1 } },
    });
  }

  async getTopSellers() {
    return this.prisma.seller.findMany({
      where: { status: "ACTIVE" },
      orderBy: { productCount: "desc" },
      take: 10,
      select: { id: true, storeName: true, slug: true, rating: true, productCount: true, ratingCount: true },
    });
  }

  async getOrdersByStatus() {
    const statuses = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];
    const counts = await Promise.all(
      statuses.map((s) => this.prisma.order.count({ where: { status: s as any } })),
    );
    return statuses.map((status, i) => ({ status, count: counts[i] }));
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search } }, { mobile: { contains: search } }] } : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.user.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async toggleUserBlock(id: string, blocked: boolean) {
    return this.prisma.user.update({ where: { id }, data: { isBlocked: blocked } });
  }

  // Seller Management
  async getSellers(page = 1, limit = 20, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.OR = [{ storeName: { contains: search, mode: "insensitive" } }, { user: { name: { contains: search, mode: "insensitive" } } }];
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.seller.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, mobile: true, email: true } }, documents: true, bankAccount: true, balance: true },
      }),
      this.prisma.seller.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getSellerDetail(id: string) {
    return this.prisma.seller.findUnique({
      where: { id },
      include: { user: true, documents: true, bankAccount: true, balance: true, products: { take: 5, include: { images: { take: 1 } } } },
    });
  }

  async approveSeller(id: string, adminId: string) {
    const seller = await this.prisma.seller.update({ where: { id }, data: { status: "ACTIVE", kycStatus: "APPROVED" } });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, actorRole: "ADMIN", action: "SELLER_APPROVED", resource: "seller", resourceId: id, metadata: { storeName: seller.storeName } },
    });
    return seller;
  }

  async rejectSeller(id: string, adminId: string, reason?: string) {
    const seller = await this.prisma.seller.update({ where: { id }, data: { status: "REJECTED", kycStatus: "REJECTED" } });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, actorRole: "ADMIN", action: "SELLER_REJECTED", resource: "seller", resourceId: id, metadata: { storeName: seller.storeName, reason } },
    });
    return seller;
  }

  async suspendSeller(id: string, adminId: string, reason?: string) {
    const seller = await this.prisma.seller.update({ where: { id }, data: { status: "SUSPENDED" } });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, actorRole: "ADMIN", action: "SELLER_SUSPENDED", resource: "seller", resourceId: id, metadata: { storeName: seller.storeName, reason } },
    });
    return seller;
  }

  async reactivateSeller(id: string, adminId: string) {
    const seller = await this.prisma.seller.update({ where: { id }, data: { status: "ACTIVE" } });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, actorRole: "ADMIN", action: "SELLER_REACTIVATED", resource: "seller", resourceId: id, metadata: { storeName: seller.storeName } },
    });
    return seller;
  }

  // Product Approval
  async getPendingProducts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.productApproval.findMany({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        skip, take: limit, orderBy: { createdAt: "desc" },
        include: { product: { include: { images: true, category: { select: { name: true } } } }, seller: { select: { storeName: true } } },
      }),
      this.prisma.productApproval.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async approveProduct(approvalId: string, adminId: string) {
    const approval = await this.prisma.productApproval.findUnique({ where: { id: approvalId } });
    if (!approval) throw new Error("Approval not found");

    return this.prisma.$transaction(async (tx) => {
      await tx.productApproval.update({
        where: { id: approvalId },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: adminId },
      });
      await tx.product.update({
        where: { id: approval.productId },
        data: { isApproved: true },
      });
      await tx.auditLog.create({
        data: { actorId: adminId, actorRole: "ADMIN", action: "PRODUCT_APPROVED", resource: "product", resourceId: approval.productId },
      });
      return { success: true };
    });
  }

  async rejectProduct(approvalId: string, adminId: string, reason?: string) {
    const approval = await this.prisma.productApproval.findUnique({ where: { id: approvalId } });
    if (!approval) throw new Error("Approval not found");

    return this.prisma.$transaction(async (tx) => {
      await tx.productApproval.update({
        where: { id: approvalId },
        data: { status: "REJECTED", reviewedAt: new Date(), reviewedBy: adminId, rejectionReason: reason },
      });
      await tx.product.update({
        where: { id: approval.productId },
        data: { isApproved: false },
      });
      await tx.auditLog.create({
        data: { actorId: adminId, actorRole: "ADMIN", action: "PRODUCT_REJECTED", resource: "product", resourceId: approval.productId, metadata: { reason } },
      });
      return { success: true };
    });
  }

  // Orders
  async getOrders(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, mobile: true } }, address: true, seller: { select: { storeName: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // Config
  async getConfig() {
    return this.prisma.systemConfig.findMany({ orderBy: { category: "asc" } });
  }

  async updateConfig(key: string, value: any) {
    return this.prisma.systemConfig.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  // Analytics
  async getAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalCustomers, newCustomers30d, totalOrders, orders30d, gmvResult, revenue30dResult, totalProducts, activeProducts, pendingApprovals] = await Promise.all([
      this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      this.prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.order.aggregate({ where: { paymentStatus: "SUCCESS" }, _sum: { total: true } }),
      this.prisma.order.aggregate({ where: { paymentStatus: "SUCCESS", createdAt: { gte: thirtyDaysAgo } }, _sum: { total: true } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true, isApproved: true } }),
      this.prisma.productApproval.count({ where: { status: "SUBMITTED" } }),
    ]);

    const gmv = gmvResult._sum.total || 0;
    const revenue30d = revenue30dResult._sum.total || 0;
    const aov = totalOrders > 0 ? gmv / totalOrders : 0;
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

    return { totalCustomers, newCustomers30d, totalOrders, orders30d, gmv, revenue30d, aov: Math.round(aov * 100) / 100, conversionRate: Math.round(conversionRate * 100) / 100, totalProducts, activeProducts, pendingApprovals };
  }

  // Fraud
  async getFraudEvents(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.fraudRiskEvent.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.fraudRiskEvent.count(),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async reviewFraudEvent(id: string, action: string, reviewedBy: string) {
    return this.prisma.fraudRiskEvent.update({ where: { id }, data: { action, reviewedBy, reviewedAt: new Date() } });
  }

  // Audit Logs
  async getAuditLogs(page = 1, limit = 50, action?: string, resource?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // Payouts
  async getSellerPayouts(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.sellerPayout.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { seller: { select: { storeName: true } } },
      }),
      this.prisma.sellerPayout.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async processPayout(payoutId: string, adminId: string, reference: string) {
    const payout = await this.prisma.sellerPayout.update({
      where: { id: payoutId },
      data: { status: "COMPLETED", reference, settledAt: new Date() },
    });

    await this.prisma.sellerBalance.update({
      where: { sellerId: payout.sellerId },
      data: { pendingEarnings: { decrement: payout.amount }, availableBalance: { decrement: payout.amount }, totalPaid: { increment: payout.amount } },
    });

    await this.prisma.auditLog.create({
      data: { actorId: adminId, actorRole: "ADMIN", action: "PAYOUT_PROCESSED", resource: "payout", resourceId: payoutId, metadata: { amount: payout.amount, reference } },
    });

    return payout;
  }
}
