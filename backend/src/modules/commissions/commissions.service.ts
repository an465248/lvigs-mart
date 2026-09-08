import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async getConfigs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.commissionConfig.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.commissionConfig.count(),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createConfig(dto: {
    name: string;
    type: string;
    targetId?: string;
    percentage: number;
    minCommission?: number;
    maxCommission?: number;
  }) {
    return this.prisma.commissionConfig.create({ data: dto });
  }

  async updateConfig(id: string, dto: Partial<{
    name: string;
    percentage: number;
    minCommission: number;
    maxCommission: number;
    isActive: boolean;
  }>) {
    return this.prisma.commissionConfig.update({ where: { id }, data: dto });
  }

  async deleteConfig(id: string) {
    return this.prisma.commissionConfig.delete({ where: { id } });
  }

  async getCommissionForOrder(sellerId: string, categoryId: string, amount: number) {
    // Check seller-specific commission
    const sellerConfig = await this.prisma.commissionConfig.findFirst({
      where: { type: "SELLER", targetId: sellerId, isActive: true },
    });
    if (sellerConfig) {
      const commission = Math.max(sellerConfig.minCommission, Math.min(amount * sellerConfig.percentage / 100, sellerConfig.maxCommission || Infinity));
      return { percentage: sellerConfig.percentage, amount: commission, configName: sellerConfig.name };
    }

    // Check category-specific commission
    const categoryConfig = await this.prisma.commissionConfig.findFirst({
      where: { type: "CATEGORY", targetId: categoryId, isActive: true },
    });
    if (categoryConfig) {
      const commission = Math.max(categoryConfig.minCommission, Math.min(amount * categoryConfig.percentage / 100, categoryConfig.maxCommission || Infinity));
      return { percentage: categoryConfig.percentage, amount: commission, configName: categoryConfig.name };
    }

    // Default global commission
    const globalConfig = await this.prisma.commissionConfig.findFirst({
      where: { type: "GLOBAL", isActive: true },
    });
    if (globalConfig) {
      const commission = Math.max(globalConfig.minCommission, Math.min(amount * globalConfig.percentage / 100, globalConfig.maxCommission || Infinity));
      return { percentage: globalConfig.percentage, amount: commission, configName: globalConfig.name };
    }

    return { percentage: 10, amount: amount * 0.10, configName: "Default (10%)" };
  }

  async calculateAndRecordCommission(orderId: string, sellerId: string, orderItemId: string, grossAmount: number, categoryId: string) {
    const comm = await this.getCommissionForOrder(sellerId, categoryId, grossAmount);

    const commission = await this.prisma.sellerCommission.create({
      data: {
        sellerId,
        orderId,
        orderItemId,
        grossAmount,
        commissionPct: comm.percentage,
        commissionAmt: comm.amount,
        netAmount: grossAmount - comm.amount,
        status: "PENDING",
      },
    });

    // Update seller balance
    await this.prisma.sellerBalance.upsert({
      where: { sellerId },
      update: { pendingEarnings: { increment: grossAmount - comm.amount } },
      create: { sellerId, pendingEarnings: grossAmount - comm.amount },
    });

    return commission;
  }

  async getSellerCommissions(sellerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.sellerCommission.findMany({
        where: { sellerId },
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: { order: { select: { shortId: true } } },
      }),
      this.prisma.sellerCommission.count({ where: { sellerId } }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}
