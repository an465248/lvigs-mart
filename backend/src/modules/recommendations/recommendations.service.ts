import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

const CACHE_TTL = 900;

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async forUser(userId: string, limit = 10) {
    const cacheKey = `rec:forYou:${userId}:${limit}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) return cached;

    const events = await this.prisma.userEvent.findMany({
      where: { userId, type: { in: ["PRODUCT_VIEW", "ADD_TO_CART", "PURCHASE"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      distinct: ["productId"],
      select: { productId: true },
    });
    const productIds = events.map((e) => e.productId).filter(Boolean) as string[];
    if (productIds.length === 0) {
      const trending = await this.getTrending(limit);
      return trending;
    }
    const categories = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { categoryId: true },
    });
    const catIds = [...new Set(categories.map((c) => c.categoryId))];
    const result = await this.prisma.product.findMany({
      where: { categoryId: { in: catIds }, isApproved: true, isActive: true, id: { notIn: productIds } },
      take: limit,
      select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, rating: true, ratingCount: true },
    });

    await this.redis.cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  }

  async trendingNearYou(userId: string, limit = 10) {
    const cacheKey = `rec:trendingNear:${userId}:${limit}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) return cached;

    const userAddress = await this.prisma.userAddress.findFirst({
      where: { userId, isDefault: true },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const where: any = {
      createdAt: { gte: thirtyDaysAgo },
      type: "PURCHASE",
    };

    if (userAddress?.pincode) {
      const nearbyUsers = await this.prisma.userAddress.findMany({
        where: { pincode: userAddress.pincode },
        select: { userId: true },
      });
      const userIds = nearbyUsers.map((u) => u.userId);
      where.userId = { in: userIds };
    }

    const events = await this.prisma.userEvent.groupBy({
      by: ["productId"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit + 5,
    });

    const productIds = events.map((e) => e.productId).filter(Boolean) as string[];
    const result = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isApproved: true, isActive: true },
      take: limit,
      select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, rating: true, ratingCount: true },
    });

    await this.redis.cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  }

  async becauseYouViewed(userId: string, productId: string, limit = 10) {
    const cacheKey = `rec:becauseViewed:${userId}:${productId}:${limit}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, brandId: true, tags: true },
    });
    if (!product) return [];

    const viewedEvents = await this.prisma.userEvent.findMany({
      where: { userId, type: "PRODUCT_VIEW", productId: { not: productId } },
      orderBy: { createdAt: "desc" },
      take: 30,
      distinct: ["productId"],
      select: { productId: true },
    });
    const viewedIds = viewedEvents.map((e) => e.productId).filter(Boolean) as string[];

    const result = await this.prisma.product.findMany({
      where: {
        id: { not: productId, notIn: viewedIds },
        isApproved: true,
        isActive: true,
        OR: [
          { categoryId: product.categoryId },
          { brandId: product.brandId },
          { tags: { hasSome: product.tags.slice(0, 3) } },
        ],
      },
      orderBy: { rating: "desc" },
      take: limit,
      select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, rating: true, ratingCount: true },
    });

    await this.redis.cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  }

  async continueShopping(userId: string, limit = 10) {
    const cacheKey = `rec:continueShop:${userId}:${limit}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) return cached;

    const [cartItems, wishlistItems] = await Promise.all([
      this.prisma.cartItem.findMany({
        where: { cart: { userId } },
        select: { product: { select: { categoryId: true, brandId: true } } },
      }),
      this.prisma.wishlistItem.findMany({
        where: { wishlist: { userId } },
        select: { product: { select: { categoryId: true, brandId: true } } },
      }),
    ]);

    const catIds = [...new Set([
      ...cartItems.map((i) => i.product?.categoryId).filter(Boolean),
      ...wishlistItems.map((i) => i.product?.categoryId).filter(Boolean),
    ])];

    if (catIds.length === 0) return this.getTrending(limit);

    const result = await this.prisma.product.findMany({
      where: { categoryId: { in: catIds as string[] }, isApproved: true, isActive: true },
      orderBy: { rating: "desc" },
      take: limit,
      select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, rating: true, ratingCount: true },
    });

    await this.redis.cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  }

  async personalizedDeals(userId: string, limit = 10) {
    const cacheKey = `rec:deals:${userId}:${limit}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) return cached;

    const events = await this.prisma.userEvent.findMany({
      where: { userId, type: { in: ["PRODUCT_VIEW", "ADD_TO_CART", "WISHLIST"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      distinct: ["productId"],
      select: { productId: true },
    });
    const productIds = events.map((e) => e.productId).filter(Boolean) as string[];

    const where: any = {
      isApproved: true,
      isActive: true,
      mrp: { gt: 0 },
    };

    if (productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { categoryId: true },
      });
      const catIds = [...new Set(products.map((c) => c.categoryId))];
      where.categoryId = { in: catIds };
    }

    where.price = { lt: where.mrp || undefined };

    const allProducts = await this.prisma.product.findMany({
      where,
      orderBy: { mrp: "desc" },
      take: limit * 2,
      select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, rating: true, ratingCount: true },
    });

    const result = allProducts
      .filter((p) => p.mrp > p.price)
      .sort((a, b) => ((b.mrp - b.price) / b.mrp) - ((a.mrp - a.price) / a.mrp))
      .slice(0, limit);

    await this.redis.cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  }

  async personalizedCategories(userId: string, limit = 10) {
    const cacheKey = `rec:cats:${userId}:${limit}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) return cached;

    const events = await this.prisma.userEvent.findMany({
      where: { userId, type: { in: ["PRODUCT_VIEW", "ADD_TO_CART", "PURCHASE", "CATEGORY_VIEW"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { productId: true, metadata: true },
    });

    const productIds = events.map((e) => e.productId).filter(Boolean) as string[];
    const categoryCounts: Record<string, number> = {};

    for (const e of events) {
      const catSlug = (e.metadata as any)?.categorySlug;
      if (catSlug) {
        categoryCounts[catSlug] = (categoryCounts[catSlug] || 0) + 1;
      }
    }

    if (productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { categoryId: true },
      });
      for (const p of products) {
        categoryCounts[p.categoryId] = (categoryCounts[p.categoryId] || 0) + 1;
      }
    }

    const sortedCats = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => id);

    if (sortedCats.length === 0) {
      return this.prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { order: "asc" },
        take: limit,
        select: { id: true, slug: true, name: true, icon: true, image: true },
      });
    }

    const result = await this.prisma.category.findMany({
      where: { id: { in: sortedCats }, isActive: true },
      select: { id: true, slug: true, name: true, icon: true, image: true },
    });

    await this.redis.cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  }

  async frequentlyBoughtTogether(productId: string, limit = 6) {
    const cacheKey = `rec:fbt:${productId}:${limit}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) return cached;

    const orders = await this.prisma.orderItem.findMany({
      where: { productId },
      select: { orderId: true },
    });
    const orderIds = orders.map((o) => o.orderId);
    if (orderIds.length === 0) return [];
    const coItems = await this.prisma.orderItem.groupBy({
      by: ["productId"],
      where: { orderId: { in: orderIds }, productId: { not: productId } },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: limit,
    });
    const ids = coItems.map((c) => c.productId);
    const result = await this.prisma.product.findMany({
      where: { id: { in: ids }, isApproved: true, isActive: true },
      select: { id: true, slug: true, title: true, price: true, mrp: true, images: true },
    });

    await this.redis.cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  }

  async similar(productId: string, limit = 6) {
    const cacheKey = `rec:similar:${productId}:${limit}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { categoryId: true, brandId: true } });
    if (!product) return [];
    const result = await this.prisma.product.findMany({
      where: { categoryId: product.categoryId, isApproved: true, isActive: true, id: { not: productId } },
      take: limit,
      select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, rating: true, ratingCount: true },
    });

    await this.redis.cacheSet(cacheKey, result, CACHE_TTL);
    return result;
  }

  private async getTrending(limit: number) {
    return this.prisma.product.findMany({
      where: { isApproved: true, isActive: true, isBestseller: true },
      take: limit,
      select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, rating: true, ratingCount: true },
    });
  }
}