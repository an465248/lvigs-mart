import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache/cache.service";

@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  // Banners
  async getActiveBanners(type?: string) {
    const cacheKey = type
      ? `banners:active:${type}`
      : "banners:active";

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const where: any = { isActive: true };
        if (type) where.type = type;

        const all = await this.prisma.banner.findMany({
          where,
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            subtitle: true,
            image: true,
            mobileImage: true,
            bg: true,
            fg: true,
            ctaLabel: true,
            ctaLink: true,
            ctaText: true,
            ctaUrl: true,
            link: true,
            type: true,
            position: true,
            sortOrder: true,
            isActive: true,
            startsAt: true,
            endsAt: true,
            startAt: true,
            endAt: true,
            categoryId: true,
            productId: true,
          },
        });
        return all.filter((b: any) => {
          const startDate = b.startAt || b.startsAt;
          const endDate = b.endAt || b.endsAt;
          if (startDate && new Date(startDate) > now) return false;
          if (endDate && new Date(endDate) < now) return false;
          return true;
        });
      },
      900,
    );
  }

  async getAllBanners(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.banner.findMany({
        skip,
        take: limit,
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.banner.count(),
    ]);
    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getBannerById(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException("Banner not found");
    return banner;
  }

  async createBanner(dto: {
    title: string;
    subtitle?: string;
    image: string;
    mobileImage?: string;
    bg?: string;
    fg?: string;
    ctaLabel?: string;
    ctaLink?: string;
    ctaText?: string;
    ctaUrl?: string;
    link?: string;
    type?: string;
    position?: number;
    sortOrder?: number;
    startsAt?: string;
    endsAt?: string;
    startAt?: string;
    endAt?: string;
    isActive?: boolean;
    categoryId?: string;
    productId?: string;
  }) {
    const banner = await this.prisma.banner.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        image: dto.image,
        mobileImage: dto.mobileImage,
        bg: dto.bg || "#1d47f5",
        fg: dto.fg || "#ffffff",
        ctaLabel: dto.ctaLabel,
        ctaLink: dto.ctaLink,
        ctaText: dto.ctaText,
        ctaUrl: dto.ctaUrl,
        link: dto.link,
        type: (dto.type as any) || "HOME",
        position: dto.position || 0,
        sortOrder: dto.sortOrder || dto.position || 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        categoryId: dto.categoryId,
        productId: dto.productId,
      },
    });
    await this.invalidate();
    return banner;
  }

  async updateBanner(id: string, dto: Record<string, any>) {
    await this.getBannerById(id);
    const data: any = { ...dto };
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) data.endsAt = new Date(dto.endsAt);
    if (dto.startAt) data.startAt = new Date(dto.startAt);
    if (dto.endAt) data.endAt = new Date(dto.endAt);
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.position !== undefined) data.sortOrder = dto.sortOrder || dto.position;

    const banner = await this.prisma.banner.update({ where: { id }, data });
    await this.invalidate();
    return banner;
  }

  async deleteBanner(id: string) {
    await this.getBannerById(id);
    const result = await this.prisma.banner.delete({ where: { id } });
    await this.invalidate();
    return result;
  }

  async toggleBannerActive(id: string) {
    const banner = await this.getBannerById(id);
    const updated = await this.prisma.banner.update({
      where: { id },
      data: { isActive: !banner.isActive },
    });
    await this.invalidate();
    return updated;
  }

  async reorderBanners(bannerIds: string[]) {
    const updates = bannerIds.map((id, index) =>
      this.prisma.banner.update({
        where: { id },
        data: { sortOrder: index, position: index },
      })
    );
    await this.prisma.$transaction(updates);
    await this.invalidate();
    return { success: true };
  }

  async invalidate() {
    await this.cache.del("banners:active");
    await this.cache.delPattern("banners:active:*");
    await this.cache.del(CacheService.keys.homeBanners());
  }

  // Offers
  async getActiveOffers(type?: string) {
    const now = new Date();
    const where: any = {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    };
    if (type) where.type = type;

    return this.prisma.offer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getAllOffers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.offer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.offer.count(),
    ]);
    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createOffer(dto: {
    title: string;
    description?: string;
    image?: string;
    type: string;
    badge?: string;
    discountPct?: number;
    discountAmt?: number;
    productId?: string;
    categoryId?: string;
    sellerId?: string;
    brandId?: string;
    startsAt: string;
    endsAt: string;
  }) {
    return this.prisma.offer.create({
      data: {
        ...dto,
        type: dto.type as any,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  async updateOffer(id: string, dto: Record<string, any>) {
    if (dto.startsAt) dto.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) dto.endsAt = new Date(dto.endsAt);
    return this.prisma.offer.update({ where: { id }, data: dto });
  }

  async deleteOffer(id: string) {
    return this.prisma.offer.delete({ where: { id } });
  }

  // Flash Sales
  async getActiveFlashSales() {
    const now = new Date();
    return this.prisma.flashSale.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: { take: 1 },
              },
            },
          },
        },
      },
    });
  }

  async getAllFlashSales(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.flashSale.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { products: true },
      }),
      this.prisma.flashSale.count(),
    ]);
    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createFlashSale(dto: {
    title: string;
    description?: string;
    image?: string;
    startsAt: string;
    endsAt: string;
    products?: { productId: string; salePrice: number; stock: number }[];
  }) {
    return this.prisma.flashSale.create({
      data: {
        title: dto.title,
        description: dto.description,
        image: dto.image,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        products: dto.products?.length
          ? {
              create: dto.products.map((p) => ({
                productId: p.productId,
                salePrice: p.salePrice,
                stock: p.stock,
              })),
            }
          : undefined,
      },
      include: { products: true },
    });
  }

  async updateFlashSale(id: string, dto: Record<string, any>) {
    if (dto.startsAt) dto.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) dto.endsAt = new Date(dto.endsAt);
    return this.prisma.flashSale.update({ where: { id }, data: dto });
  }

  async deleteFlashSale(id: string) {
    return this.prisma.flashSale.delete({ where: { id } });
  }
}
