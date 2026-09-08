import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async track(userId: string | null, dto: { type: string; productId?: string; sessionId?: string; metadata?: any }) {
    const event = await this.prisma.userEvent.create({
      data: {
        userId,
        sessionId: dto.sessionId,
        type: dto.type as any,
        productId: dto.productId,
        metadata: dto.metadata,
      },
    });

    if (dto.type === "PRODUCT_VIEW" && dto.productId) {
      await this.prisma.product.update({
        where: { id: dto.productId },
        data: { views: { increment: 1 } },
      });

      await this.redis.del("trending:events");
    }

    if (dto.productId) {
      await this.redis.del(`trending:products`);
    }

    return event;
  }

  async history(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.userEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: {
            select: { id: true, slug: true, title: true, price: true, mrp: true, images: true },
          },
        },
      }),
      this.prisma.userEvent.count({ where: { userId } }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async trendingEvents() {
    const cache = await this.redis.cacheGet("trending:events");
    if (cache) return cache;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.userEvent.groupBy({
      by: ["productId"],
      where: { createdAt: { gte: sevenDaysAgo }, productId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    });

    const productIds = events.map((e) => e.productId).filter(Boolean) as string[];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isApproved: true, isActive: true },
      select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, rating: true },
    });

    await this.redis.cacheSet("trending:events", products, 900);
    return products;
  }
}
