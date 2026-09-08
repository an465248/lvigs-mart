import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async register(userId: string, dto: {
    storeName: string;
    description?: string;
    panNumber?: string;
    gstNumber?: string;
    bankAccount?: { accountName: string; accountNumber: string; ifsc: string; bankName: string; upi?: string };
    documents?: { type: string; url: string }[];
  }) {
    const existing = await this.prisma.seller.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException("Seller already registered");

    const slug = dto.storeName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-") + "-" + Date.now().toString(36);

    return this.prisma.$transaction(async (tx) => {
      const seller = await tx.seller.create({
        data: {
          userId,
          storeName: dto.storeName,
          slug,
          description: dto.description,
          panNumber: dto.panNumber,
          gstNumber: dto.gstNumber,
          status: "PENDING",
          kycStatus: dto.documents?.length ? "SUBMITTED" : "NOT_STARTED",
        },
      });

      if (dto.bankAccount) {
        await tx.sellerBankAccount.create({
          data: { sellerId: seller.id, ...dto.bankAccount },
        });
      }

      if (dto.documents?.length) {
        await tx.sellerDocument.createMany({
          data: dto.documents.map((d) => ({ sellerId: seller.id, type: d.type, url: d.url, status: "SUBMITTED" })),
        });
      }

      await tx.sellerBalance.create({ data: { sellerId: seller.id } });

      await tx.auditLog.create({
        data: { actorId: userId, actorRole: "SELLER", action: "SELLER_REGISTERED", resource: "seller", resourceId: seller.id, metadata: { storeName: dto.storeName } },
      });

      return seller;
    });
  }

  async getProfile(userId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      include: { bankAccount: true, documents: true, balance: true },
    });
    if (!seller) throw new NotFoundException("Seller not found");
    return seller;
  }

  async updateProfile(userId: string, dto: {
    storeName?: string;
    description?: string;
    logo?: string;
    banner?: string;
  }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");
    if (seller.status !== "ACTIVE") throw new ForbiddenException("Seller account is not active");

    return this.prisma.seller.update({ where: { id: seller.id }, data: dto });
  }

  async updateBankAccount(userId: string, dto: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    upi?: string;
  }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    return this.prisma.sellerBankAccount.upsert({
      where: { sellerId: seller.id },
      update: dto,
      create: { sellerId: seller.id, ...dto },
    });
  }

  async uploadDocument(userId: string, dto: { type: string; url: string }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const doc = await this.prisma.sellerDocument.create({
      data: { sellerId: seller.id, type: dto.type, url: dto.url, status: "SUBMITTED" },
    });

    await this.prisma.seller.update({
      where: { id: seller.id },
      data: { kycStatus: "SUBMITTED" },
    });

    return doc;
  }

  async getDashboard(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      returnRequests,
      totalProducts,
      lowStockProducts,
      revenue,
      todayRevenue,
      pendingRevenue,
      balance,
    ] = await Promise.all([
      this.prisma.order.count({ where: { sellerId: seller.id } }),
      this.prisma.order.count({ where: { sellerId: seller.id, createdAt: { gte: todayStart } } }),
      this.prisma.order.count({ where: { sellerId: seller.id, status: { in: ["PLACED", "CONFIRMED", "PACKED"] } } }),
      this.prisma.order.count({ where: { sellerId: seller.id, status: "DELIVERED" } }),
      this.prisma.order.count({ where: { sellerId: seller.id, status: "CANCELLED" } }),
      this.prisma.returnRequest.count({ where: { sellerId: seller.id, status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED"] } } }),
      this.prisma.product.count({ where: { sellerId: seller.id } }),
      this.prisma.product.count({ where: { sellerId: seller.id, stock: { lte: 5 }, isActive: true } }),
      this.prisma.order.aggregate({ where: { sellerId: seller.id, paymentStatus: "SUCCESS" }, _sum: { total: true } }),
      this.prisma.order.aggregate({ where: { sellerId: seller.id, paymentStatus: "SUCCESS", createdAt: { gte: todayStart } }, _sum: { total: true } }),
      this.prisma.order.aggregate({ where: { sellerId: seller.id, paymentStatus: "SUCCESS", status: { in: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED"] } }, _sum: { total: true } }),
      this.prisma.sellerBalance.findUnique({ where: { sellerId: seller.id } }),
    ]);

    const totalSales = revenue._sum.total || 0;
    const todaySales = todayRevenue._sum.total || 0;
    const pendingSales = pendingRevenue._sum.total || 0;

    const commissionRate = 0.10;
    const platformCommission = totalSales * commissionRate;

    return {
      stats: {
        totalSales,
        todaySales,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        returnRequests,
        totalProducts,
        lowStockProducts,
        availableBalance: balance?.availableBalance || 0,
        pendingPayout: balance?.pendingEarnings || 0,
        completedPayout: balance?.totalPaid || 0,
        platformCommission,
      },
      seller,
    };
  }

  async getSalesChart(userId: string, days = 30) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const since = new Date(Date.now() - days * 86400000);
    const orders = await this.prisma.order.findMany({
      where: { sellerId: seller.id, createdAt: { gte: since }, paymentStatus: "SUCCESS" },
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

  // Product Management
  async getProducts(userId: string, page = 1, limit = 20) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { sellerId: seller.id },
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: { images: true, variants: true, category: { select: { name: true } }, approvals: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
      this.prisma.product.count({ where: { sellerId: seller.id } }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async addProduct(userId: string, dto: {
    title: string;
    description: string;
    shortDesc?: string;
    categoryId: string;
    brandId: string;
    mrp: number;
    price: number;
    taxRate?: number;
    stock: number;
    lowStockThreshold?: number;
    hsnCode?: string;
    weight?: number;
    tags?: string[];
    images?: string[];
    variants?: { sku: string; color?: string; size?: string; material?: string; mrp: number; price: number; stock: number; weight?: number }[];
    attributes?: { key: string; value: string }[];
  }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");
    if (seller.status !== "ACTIVE") throw new ForbiddenException("Seller account is not active");

    const slug = dto.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-") + "-" + Date.now().toString(36);

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          slug,
          title: dto.title,
          description: dto.description,
          shortDesc: dto.shortDesc,
          sellerId: seller.id,
          categoryId: dto.categoryId,
          brandId: dto.brandId,
          mrp: dto.mrp,
          price: dto.price,
          taxRate: dto.taxRate || 0,
          stock: dto.stock,
          lowStockThreshold: dto.lowStockThreshold || 5,
          hsnCode: dto.hsnCode,
          weight: dto.weight,
          tags: dto.tags || [],
          isApproved: false,
          isActive: true,
        },
      });

      if (dto.images?.length) {
        await tx.productImage.createMany({
          data: dto.images.map((url, i) => ({ productId: product.id, url, order: i })),
        });
      }

      if (dto.variants?.length) {
        await tx.productVariant.createMany({
          data: dto.variants.map((v) => ({
            productId: product.id,
            sku: v.sku,
            color: v.color,
            size: v.size,
            material: v.material,
            mrp: v.mrp,
            price: v.price,
            stock: v.stock,
            weight: v.weight,
          })),
        });
      }

      if (dto.attributes?.length) {
        await tx.productAttribute.createMany({
          data: dto.attributes.map((a) => ({ productId: product.id, key: a.key, value: a.value })),
        });
      }

      await tx.productApproval.create({
        data: { productId: product.id, sellerId: seller.id, status: "DRAFT" },
      });

      await tx.inventory.create({
        data: { productId: product.id, warehouseId: "default", quantity: dto.stock },
      });

      await tx.seller.update({ where: { id: seller.id }, data: { productCount: { increment: 1 } } });

      return product;
    });
  }

  async updateProduct(userId: string, productId: string, dto: Record<string, any>) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId: seller.id } });
    if (!product) throw new NotFoundException("Product not found");

    const { images, variants, attributes, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id: productId }, data });

      if (images) {
        await tx.productImage.deleteMany({ where: { productId } });
        if (images.length) {
          await tx.productImage.createMany({
            data: images.map((url: string, i: number) => ({ productId, url, order: i })),
          });
        }
      }

      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId } });
        if (variants.length) {
          await tx.productVariant.createMany({
            data: variants.map((v: any) => ({
              productId,
              sku: v.sku,
              color: v.color,
              size: v.size,
              material: v.material,
              mrp: v.mrp,
              price: v.price,
              stock: v.stock,
              weight: v.weight,
            })),
          });
        }
      }

      if (attributes) {
        await tx.productAttribute.deleteMany({ where: { productId } });
        if (attributes.length) {
          await tx.productAttribute.createMany({
            data: attributes.map((a: any) => ({ productId, key: a.key, value: a.value })),
          });
        }
      }

      return updated;
    });
  }

  async deleteProduct(userId: string, productId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId: seller.id } });
    if (!product) throw new NotFoundException("Product not found");

    const hasOrders = await this.prisma.orderItem.findFirst({
      where: { productId, order: { status: { notIn: ["CANCELLED", "RETURNED"] } } },
    });
    if (hasOrders) throw new ForbiddenException("Cannot delete product with active orders");

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: productId }, data: { isActive: false } });
      await tx.seller.update({ where: { id: seller.id }, data: { productCount: { decrement: 1 } } });
    });

    return { success: true };
  }

  async submitProductForApproval(userId: string, productId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId: seller.id } });
    if (!product) throw new NotFoundException("Product not found");

    const existing = await this.prisma.productApproval.findFirst({ where: { productId } });
    if (existing) {
      return this.prisma.productApproval.update({
        where: { id: existing.id },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      });
    }

    return this.prisma.productApproval.create({
      data: { productId, sellerId: seller.id, status: "SUBMITTED", submittedAt: new Date() },
    });
  }

  // Seller Orders
  async getSellerOrders(userId: string, page = 1, limit = 20, status?: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const skip = (page - 1) * limit;
    const where: any = { sellerId: seller.id };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          user: { select: { id: true, name: true, mobile: true } },
          address: true,
          payment: { select: { method: true, status: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async updateSellerOrderStatus(userId: string, orderId: string, status: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const order = await this.prisma.order.findFirst({ where: { id: orderId, sellerId: seller.id } });
    if (!order) throw new NotFoundException("Order not found");

    const validTransitions: Record<string, string[]> = {
      PLACED: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PACKED", "CANCELLED"],
      PACKED: ["SHIPPED"],
      SHIPPED: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED"],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: status as any,
          deliveredAt: status === "DELIVERED" ? new Date() : undefined,
          cancelledAt: status === "CANCELLED" ? new Date() : undefined,
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId, status: status as any, note: `Status updated by seller`, byUserId: userId },
      });

      return updated;
    });
  }

  // Inventory Management
  async getInventory(userId: string, page = 1, limit = 20) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where: { product: { sellerId: seller.id } },
        skip, take: limit,
        include: { product: { select: { id: true, title: true, images: { take: 1 } } }, variant: true, warehouse: true },
      }),
      this.prisma.inventory.count({ where: { product: { sellerId: seller.id } } }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async updateInventoryStock(userId: string, inventoryId: string, quantity: number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const inv = await this.prisma.inventory.findFirst({
      where: { id: inventoryId, product: { sellerId: seller.id } },
    });
    if (!inv) throw new NotFoundException("Inventory record not found");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { id: inventoryId },
        data: { quantity },
      });

      await tx.inventoryTransaction.create({
        data: {
          productId: inv.productId || undefined,
          variantId: inv.variantId || undefined,
          warehouseId: inv.warehouseId,
          type: "ADJUSTMENT",
          quantity: quantity - inv.quantity,
          notes: "Stock adjusted by seller",
          createdBy: userId,
        },
      });

      if (inv.productId) {
        await tx.product.update({
          where: { id: inv.productId },
          data: { stock: quantity },
        });
      }

      return updated;
    });
  }

  async getInventoryHistory(userId: string, productId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const product = await this.prisma.product.findFirst({ where: { id: productId, sellerId: seller.id } });
    if (!product) throw new NotFoundException("Product not found");

    return this.prisma.inventoryTransaction.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  // Payouts
  async getPayouts(userId: string, page = 1, limit = 20) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.sellerPayout.findMany({
        where: { sellerId: seller.id },
        skip, take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.sellerPayout.count({ where: { sellerId: seller.id } }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getBalance(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    let balance = await this.prisma.sellerBalance.findUnique({ where: { sellerId: seller.id } });
    if (!balance) {
      balance = await this.prisma.sellerBalance.create({ data: { sellerId: seller.id } });
    }

    return balance;
  }

  // Reviews
  async getSellerReviews(userId: string, page = 1, limit = 20) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.sellerReview.findMany({
        where: { sellerId: seller.id, isActive: true },
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.sellerReview.count({ where: { sellerId: seller.id, isActive: true } }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // Returns
  async getReturns(userId: string, page = 1, limit = 20) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Seller not found");

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where: { sellerId: seller.id },
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: { items: true, user: { select: { id: true, name: true } }, order: { select: { shortId: true } } },
      }),
      this.prisma.returnRequest.count({ where: { sellerId: seller.id } }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}
