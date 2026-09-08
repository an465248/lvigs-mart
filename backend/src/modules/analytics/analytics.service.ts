import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
import { AnalyticsEventType } from "./dto/analytics.dto";
import { createHash } from "crypto";

export interface AnalyticsEvent {
  userId?: string;
  type: AnalyticsEventType;
  productId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface AggregateMetrics {
  period: { from: Date; to: Date };
  totalEvents: number;
  byType: Record<string, number>;
  uniqueUsers: number;
  topProducts: { productId: string; count: number }[];
}

export interface FunnelData {
  userId: string;
  steps: { type: string; count: number; firstAt: Date | null; lastAt: Date | null }[];
  conversionRates: Record<string, number>;
}

const FUNNEL_STEPS = [
  AnalyticsEventType.APP_OPEN,
  AnalyticsEventType.SEARCH,
  AnalyticsEventType.PRODUCT_VIEW,
  AnalyticsEventType.ADD_TO_CART,
  AnalyticsEventType.CHECKOUT_STARTED,
  AnalyticsEventType.PAYMENT_SUCCESS,
  AnalyticsEventType.ORDER_CREATED,
];

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly CACHE_TTL = 900; // 15 minutes

  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const dedupKey = this.generateDedupKey(event);
    const exists = await this.redis.exists(`dedup:${dedupKey}`);
    if (exists) return;

    await this.redis.set(`dedup:${dedupKey}`, "1", this.CACHE_TTL);

    try {
      await this.prisma.userEvent.create({
        data: {
          userId: event.userId || null,
          sessionId: event.sessionId,
          type: event.type as any,
          productId: event.productId,
          metadata: event.metadata,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to track event: ${err.message}`);
    }

    try {
      const client = (this.redis as any).client;
      if (client?.publish) {
        await client.publish("analytics:events", JSON.stringify(event));
      }
    } catch {
      // Redis publish is best-effort
    }
  }

  async getEvents(
    filters: { userId?: string; type?: string; from?: Date; to?: Date },
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [items, total] = await Promise.all([
      this.prisma.userEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: { select: { id: true, slug: true, title: true, price: true, images: { take: 1 } } },
        },
      }),
      this.prisma.userEvent.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getAggregateMetrics(from: Date, to: Date): Promise<AggregateMetrics> {
    const cacheKey = `analytics:metrics:${from.getTime()}:${to.getTime()}`;
    const cached = await this.redis.cacheGet<AggregateMetrics>(cacheKey);
    if (cached) return cached;

    const events = await this.prisma.userEvent.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { type: true, userId: true, productId: true },
    });

    const byType: Record<string, number> = {};
    const userIdSet = new Set<string>();
    const productCounts: Record<string, number> = {};

    for (const e of events) {
      byType[e.type] = (byType[e.type] || 0) + 1;
      if (e.userId) userIdSet.add(e.userId);
      if (e.productId) {
        productCounts[e.productId] = (productCounts[e.productId] || 0) + 1;
      }
    }

    const topProducts = Object.entries(productCounts)
      .map(([productId, count]) => ({ productId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const metrics: AggregateMetrics = {
      period: { from, to },
      totalEvents: events.length,
      byType,
      uniqueUsers: userIdSet.size,
      topProducts,
    };

    await this.redis.cacheSet(cacheKey, metrics, this.CACHE_TTL);
    return metrics;
  }

  async getUserFunnel(userId: string): Promise<FunnelData> {
    const cacheKey = `analytics:funnel:${userId}`;
    const cached = await this.redis.cacheGet<FunnelData>(cacheKey);
    if (cached) return cached;

    const events = await this.prisma.userEvent.findMany({
      where: { userId, type: { in: FUNNEL_STEPS as any[] } },
      orderBy: { createdAt: "asc" },
      select: { type: true, createdAt: true },
    });

    const stepMap: Record<string, { count: number; firstAt: Date | null; lastAt: Date | null }> = {};
    for (const step of FUNNEL_STEPS) {
      stepMap[step] = { count: 0, firstAt: null, lastAt: null };
    }

    for (const e of events) {
      const s = stepMap[e.type];
      if (!s) continue;
      s.count++;
      if (!s.firstAt) s.firstAt = e.createdAt;
      s.lastAt = e.createdAt;
    }

    const steps = FUNNEL_STEPS.map((type) => ({
      type,
      count: stepMap[type].count,
      firstAt: stepMap[type].firstAt,
      lastAt: stepMap[type].lastAt,
    }));

    const conversionRates: Record<string, number> = {};
    const baseCount = steps[0]?.count || 1;
    for (let i = 1; i < steps.length; i++) {
      const prevType = steps[i - 1].type;
      const currType = steps[i].type;
      conversionRates[`${prevType}_to_${currType}`] =
        steps[i - 1].count > 0 ? Math.round((steps[i].count / steps[i - 1].count) * 10000) / 100 : 0;
      conversionRates[`${currType}_overall`] =
        Math.round((steps[i].count / baseCount) * 10000) / 100;
    }

    const funnelData: FunnelData = { userId, steps, conversionRates };
    await this.redis.cacheSet(cacheKey, funnelData, this.CACHE_TTL);
    return funnelData;
  }

  private generateDedupKey(event: AnalyticsEvent): string {
    const parts = [
      event.userId || "anon",
      event.type,
      event.productId || "",
      event.sessionId || "",
      Math.floor(Date.now() / 60000),
    ].join(":");
    return createHash("md5").update(parts).digest("hex");
  }
}
