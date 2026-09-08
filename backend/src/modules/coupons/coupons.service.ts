import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.coupon.findMany({
      where: { isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  }

  async validate(code: string, orderAmount: number): Promise<{ valid: boolean; discount: number; coupon?: any }> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return { valid: false, discount: 0 };
    if (!coupon.isActive) return { valid: false, discount: 0 };
    if (new Date() > coupon.expiresAt) return { valid: false, discount: 0 };
    if (orderAmount < coupon.minOrder) return { valid: false, discount: 0 };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, discount: 0 };

    let discount = 0;
    if (coupon.type === "PERCENT") {
      discount = Math.min((orderAmount * coupon.value) / 100, coupon.maxDiscount || Infinity);
    } else {
      discount = coupon.value;
    }
    return { valid: true, discount, coupon: { ...coupon, discount } };
  }

  validateSync(code: string, orderAmount: number) {
    return this.validate(code, orderAmount);
  }

  async incrementUsage(code: string) {
    await this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    });
  }
}