import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private redis: RedisService) {}

  async get<T = any>(key: string): Promise<T | null> {
    try {
      return await this.redis.cacheGet<T>(key);
    } catch (err) {
      this.logger.warn(`Cache get failed for ${key}: ${err}`);
      return null;
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    ttlSeconds = 3600
  ): Promise<void> {
    try {
      await this.redis.cacheSet(key, value, ttlSeconds);
    } catch (err) {
      this.logger.warn(`Cache set failed for ${key}: ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Cache del failed for ${key}: ${err}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      await this.redis.delPattern(pattern);
    } catch (err) {
      this.logger.warn(`Cache delPattern failed for ${pattern}: ${err}`);
    }
  }

  async getOrSet<T = any>(
    key: string,
    compute: () => Promise<T>,
    ttlSeconds = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await compute();
    if (value !== null && value !== undefined) {
      await this.set(key, value, ttlSeconds);
    }
    return value;
  }

  async invalidateProduct(productId: string): Promise<void> {
    await this.del(`product:${productId}`);
    await this.delPattern("products:*");
    await this.del("home:banners");
    await this.del("home:categories");
    await this.delPattern("banners:active*");
  }

  async invalidateCategory(): Promise<void> {
    await this.delPattern("category:*");
    await this.del("home:categories");
  }

  async invalidateBanners(): Promise<void> {
    await this.del("banners:active");
    await this.delPattern("banners:active:*");
    await this.del("home:banners");
  }

  static keys = {
    product: (id: string) => `product:${id}`,
    productBySlug: (slug: string) => `product:slug:${slug}`,
    products: (hash: string) => `products:${hash}`,
    category: (id: string) => `category:${id}`,
    categoryBySlug: (slug: string) => `category:slug:${slug}`,
    categories: () => "categories:all",
    brands: () => "brands:all",
    homeBanners: () => "home:banners",
    homeCategories: () => "home:categories",
    search: (hash: string) => `search:${hash}`,
    searchSuggestions: (q: string) => `search:suggest:${q}`,
    pincode: (pincode: string) => `pincode:${pincode}`,
    trendingSearches: () => "search:trending",
    bannersActive: (type?: string) =>
      type ? `banners:active:${type}` : "banners:active",
  };
}
