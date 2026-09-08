import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

const TIER_THRESHOLDS = [
  { tier: "PLATINUM", min: 20000 },
  { tier: "GOLD", min: 5000 },
  { tier: "SILVER", min: 1000 },
  { tier: "BRONZE", min: 0 },
];

function calculateTier(totalEarned: number): string {
  for (const t of TIER_THRESHOLDS) {
    if (totalEarned >= t.min) return t.tier;
  }
  return "BRONZE";
}

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async getAccount(userId: string) {
    const cacheKey = `loyalty:${userId}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) return cached;

    let account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await this.prisma.loyaltyAccount.create({
        data: { userId, pointsBalance: 0, totalEarned: 0, totalRedeemed: 0, tier: "BRONZE" },
      });
    }

    await this.redis.cacheSet(cacheKey, account, 300);
    return account;
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const account = await this.getAccount(userId);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyTransaction.count({ where: { accountId: account.id } }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async earnPoints(userId: string, points: number, type: string, description?: string, referenceType?: string, referenceId?: string) {
    const account = await this.getAccount(userId);
    const newBalance = account.pointsBalance + points;
    const newTotalEarned = account.totalEarned + points;
    const newTier = calculateTier(newTotalEarned);

    const transaction = await this.prisma.$transaction(async (tx) => {
      const txn = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type,
          points,
          balanceAfter: newBalance,
          description,
          referenceType,
          referenceId,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: newBalance,
          totalEarned: newTotalEarned,
          tier: newTier,
        },
      });

      return txn;
    });

    await this.redis.del(`loyalty:${userId}`);
    return transaction;
  }

  async redeemPoints(userId: string, points: number, orderId?: string) {
    const account = await this.getAccount(userId);

    if (account.pointsBalance < points) {
      throw new Error("Insufficient points balance");
    }

    const newBalance = account.pointsBalance - points;
    const newTotalRedeemed = account.totalRedeemed + points;

    const transaction = await this.prisma.$transaction(async (tx) => {
      const txn = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: "REDEEM",
          points: -points,
          balanceAfter: newBalance,
          description: orderId ? `Redeemed for order ${orderId}` : "Points redeemed",
          referenceType: orderId ? "ORDER" : null,
          referenceId: orderId || null,
        },
      });

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: newBalance,
          totalRedeemed: newTotalRedeemed,
        },
      });

      return txn;
    });

    await this.redis.del(`loyalty:${userId}`);
    return transaction;
  }

  async getRules() {
    return this.prisma.loyaltyRule.findMany({
      where: { isActive: true },
      orderBy: { type: "asc" },
    });
  }
}
