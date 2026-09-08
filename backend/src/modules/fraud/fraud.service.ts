import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

export interface RiskAssessment {
  score: number;
  level: "low" | "medium" | "high";
  flags: string[];
  action: "allow" | "review" | "block";
}

export interface FraudRule {
  name: string;
  weight: number;
  evaluate: (signals: UserSignals) => number;
}

export interface UserSignals {
  userId: string;
  failedPayments30d: number;
  orders7d: number;
  orders30d: number;
  cancellations30d: number;
  returns30d: number;
  refunds30d: number;
  totalOrders: number;
  accountAgeDays: number;
  referralCount7d: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const RULES: FraudRule[] = [
  {
    name: "high_cancellation_rate",
    weight: 0.3,
    evaluate: (s) => (s.totalOrders > 3 ? s.cancellations30d / s.totalOrders : 0),
  },
  {
    name: "high_return_rate",
    weight: 0.25,
    evaluate: (s) => (s.totalOrders > 3 ? s.returns30d / s.totalOrders : 0),
  },
  {
    name: "failed_payments",
    weight: 0.2,
    evaluate: (s) => Math.min(s.failedPayments30d / 5, 1),
  },
  {
    name: "order_velocity",
    weight: 0.15,
    evaluate: (s) => Math.min(s.orders7d / 15, 1),
  },
  {
    name: "referral_abuse",
    weight: 0.1,
    evaluate: (s) => (s.accountAgeDays < 7 ? Math.min(s.referralCount7d / 10, 1) : 0),
  },
];

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);
  private readonly CACHE_TTL = 900;

  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async evaluateRisk(userId: string, event: string, data: any): Promise<RiskAssessment> {
    const signals = await this.getUserSignals(userId);
    const flags: string[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    for (const rule of RULES) {
      const ruleScore = rule.evaluate(signals);
      totalScore += ruleScore * rule.weight;
      totalWeight += rule.weight;
      if (ruleScore > 0.5) {
        flags.push(rule.name);
      }
    }

    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const score = Math.round(normalizedScore * 100) / 100;

    let level: "low" | "medium" | "high";
    let action: "allow" | "review" | "block";

    if (score < 0.3) {
      level = "low";
      action = "allow";
    } else if (score < 0.6) {
      level = "medium";
      action = "review";
    } else {
      level = "high";
      action = "block";
    }

    return { score, level, flags, action };
  }

  async createRiskEvent(event: {
    userId?: string;
    sessionId?: string;
    type: string;
    riskLevel: string;
    score: number;
    details?: any;
    action?: string;
  }): Promise<void> {
    try {
      await this.prisma.fraudRiskEvent.create({
        data: {
          userId: event.userId || null,
          sessionId: event.sessionId,
          type: event.type,
          riskLevel: event.riskLevel,
          score: event.score,
          details: event.details,
          action: event.action || null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to create risk event: ${err.message}`);
    }
  }

  async getRiskEvents(
    filters: { userId?: string; type?: string; riskLevel?: string },
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;

    const [items, total] = await Promise.all([
      this.prisma.fraudRiskEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.fraudRiskEvent.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async reviewRiskEvent(
    eventId: string,
    action: string,
    notes: string,
    reviewerId: string,
  ): Promise<any> {
    return this.prisma.fraudRiskEvent.update({
      where: { id: eventId },
      data: {
        action,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        details: notes ? { reviewNotes: notes } : undefined,
      },
    });
  }

  async getUserRiskScore(userId: string): Promise<number> {
    const cacheKey = `fraud:score:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return parseFloat(cached);

    const signals = await this.getUserSignals(userId);
    let totalScore = 0;
    let totalWeight = 0;

    for (const rule of RULES) {
      const ruleScore = rule.evaluate(signals);
      totalScore += ruleScore * rule.weight;
      totalWeight += rule.weight;
    }

    const score = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
    await this.redis.set(cacheKey, score.toString(), this.CACHE_TTL);
    return score;
  }

  private async getUserSignals(userId: string): Promise<UserSignals> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    const [
      failedPayments30d,
      orders7d,
      orders30d,
      cancellations30d,
      returns30d,
      refunds30d,
      totalOrders,
      referralCount7d,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { userId, paymentStatus: "FAILED", createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.order.count({
        where: { userId, createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.order.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.order.count({
        where: { userId, status: "CANCELLED", createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.returnRequest.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.refund.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.order.count({ where: { userId } }),
      this.prisma.referralEvent.count({
        where: { referredUserId: userId, createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    const accountAgeDays = user
      ? Math.floor((now.getTime() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      : 365;

    return {
      userId,
      failedPayments30d,
      orders7d,
      orders30d,
      cancellations30d,
      returns30d,
      refunds30d,
      totalOrders,
      accountAgeDays,
      referralCount7d,
    };
  }
}
