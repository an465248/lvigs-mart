import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache/cache.service";
import { ListProductsDto } from "./dto/product.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  async list(dto: ListProductsDto) {
    const key = CacheService.keys.products(JSON.stringify(dto));
    return this.cache.getOrSet(key, async () => {
      const page = dto.page || 1;
      const limit = Math.min(dto.limit || 20, 100);
      const skip = (page - 1) * limit;

      const where: any = {
        isApproved: true,
        isActive: true,
      };

      if (dto.category) where.category = { slug: dto.category };
      if (dto.subcategory) where.subcategory = { slug: dto.subcategory };
      if (dto.brand) where.brand = { slug: dto.brand };
      if (dto.q) where.title = { contains: dto.q, mode: "insensitive" };

      if (dto.minPrice || dto.maxPrice) {
        where.price = {};
        if (dto.minPrice) where.price.gte = dto.minPrice;
        if (dto.maxPrice) where.price.lte = dto.maxPrice;
      }
      if (dto.minRating) where.rating = { gte: dto.minRating };
      if (dto.minDiscount) where.mrp = { gt: where.price?.gte || 0 };
      if (dto.inStock === "true") where.stock = { gt: 0 };

      if (dto.collection) {
        switch (dto.collection) {
          case "trending": where.tags = { has: "trending" }; break;
          case "bestsellers": where.isBestseller = true; break;
          case "flash-deals": where.isFlashDeal = true; break;
          case "new-arrivals": where.isNewArrival = true; break;
          case "deals-of-the-day": where.mrp = { gt: where.price || 0 }; break;
          case "recommended": where.rating = { gte: 3.5 }; break;
        }
      }

      const orderBy: any = {};
      if (dto.collection === "bestsellers") {
        orderBy.ratingCount = "desc";
      } else if (dto.collection === "deals-of-the-day") {
        orderBy.mrp = "desc";
      } else {
        switch (dto.sort) {
          case "price_asc": orderBy.price = "asc"; break;
          case "price_desc": orderBy.price = "desc"; break;
          case "rating": orderBy.rating = "desc"; break;
          case "newest": orderBy.createdAt = "desc"; break;
          case "popularity": orderBy.ratingCount = "desc"; break;
          case "discount": orderBy.mrp = "desc"; break;
          default: orderBy.createdAt = "desc";
        }
      }

      const [items, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true, slug: true, title: true, brand: true, brandId: true,
            categoryId: true, sellerId: true,
            price: true, mrp: true, images: true, stock: true, rating: true, ratingCount: true,
            deliveryCharge: true, freeDelivery: true, fastDelivery: true, isBestseller: true,
            isNewArrival: true, isFlashDeal: true, tags: true, createdAt: true,
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    }, 300);
  }

  async getBySlug(slug: string) {
    return this.cache.getOrSet(CacheService.keys.productBySlug(slug), async () => {
      return this.prisma.product.findUnique({
        where: { slug, isApproved: true, isActive: true },
        include: {
          brand: { select: { id: true, name: true, slug: true, logo: true } },
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { isActive: true } },
          images: { orderBy: { order: "asc" } },
          videos: true,
          attributes: true,
          reviews: {
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { user: { select: { id: true, name: true } }, media: true },
          },
        },
      });
    }, 600);
  }

  async getRelated(productId: string, categoryId: string, limit = 6) {
    return this.cache.getOrSet(`product:related:${categoryId}:${productId}`, async () => {
      return this.prisma.product.findMany({
        where: { categoryId, id: { not: productId }, isApproved: true, isActive: true },
        take: limit,
        select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, rating: true, ratingCount: true, freeDelivery: true },
      });
    }, 300);
  }

  async getCategories() {
    return this.cache.getOrSet(CacheService.keys.categories(), async () => {
      return this.prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { order: "asc" },
        include: { children: { where: { isActive: true }, orderBy: { order: "asc" } } },
      });
    }, 1800);
  }

  async getCategoryBySlug(slug: string) {
    return this.cache.getOrSet(CacheService.keys.categoryBySlug(slug), async () => {
      return this.prisma.category.findUnique({
        where: { slug, isActive: true },
        include: { children: { where: { isActive: true }, orderBy: { order: "asc" } } },
      });
    }, 1800);
  }

  async getBrands() {
    return this.cache.getOrSet(CacheService.keys.brands(), async () => {
      return this.prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
    }, 1800);
  }

  async compare(productIds: string[]) {
    if (productIds.length === 0) return { products: [], differences: [] };
    if (productIds.length > 4) productIds = productIds.slice(0, 4);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isApproved: true, isActive: true },
      select: {
        id: true, slug: true, title: true, price: true, mrp: true, images: true,
        rating: true, ratingCount: true, reviewCount: true,
        stock: true, warranty: true, returnPolicy: true,
        freeDelivery: true, fastDelivery: true, deliveryCharge: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        attributes: true,
        seller: { select: { storeName: true, rating: true } },
      },
    });

    // Extract all unique attribute keys
    const allAttrKeys = new Set<string>();
    products.forEach((p) => {
      p.attributes?.forEach((a) => allAttrKeys.add(a.key));
    });

    // Build comparison matrix
    const comparison: Record<string, any[]> = {};
    for (const key of allAttrKeys) {
      comparison[key] = products.map((p) => {
        const attr = p.attributes?.find((a) => a.key === key);
        return attr?.value || "—";
      });
    }

    // Find key differences
    const differences: string[] = [];
    if (products.length >= 2) {
      const prices = products.map((p) => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice !== maxPrice) {
        differences.push(`Price range: ₹${minPrice.toLocaleString("en-IN")} — ₹${maxPrice.toLocaleString("en-IN")}`);
      }
      const ratings = products.map((p) => p.rating).filter(Boolean);
      if (ratings.length >= 2) {
        const maxRating = Math.max(...ratings);
        const bestRated = products.find((p) => p.rating === maxRating);
        if (bestRated) differences.push(`Highest rated: ${bestRated.title} (${maxRating}★)`);
      }
    }

    return {
      products: products.map((p) => ({
        ...p,
        discount: p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
      })),
      attributes: comparison,
      differences,
    };
  }

  async findByBarcode(barcode: string) {
    // Search by SKU, or title containing barcode
    const product = await this.prisma.product.findFirst({
      where: {
        isApproved: true,
        isActive: true,
        OR: [
          { variants: { some: { sku: barcode, isActive: true } } },
          { hsnCode: barcode },
          { title: { contains: barcode, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, slug: true, title: true, price: true, mrp: true, images: true,
        rating: true, stock: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        variants: { where: { isActive: true }, select: { sku: true, price: true, stock: true, color: true, size: true } },
      },
    });

    if (!product) {
      return { found: false, barcode, message: "No product found for this barcode" };
    }

    return { found: true, product };
  }
}
