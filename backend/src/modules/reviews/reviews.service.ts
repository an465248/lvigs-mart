import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, isActive: true },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
        include: { user: { select: { id: true, name: true, avatar: true } }, media: true },
      }),
      this.prisma.review.count({ where: { productId, isActive: true } }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getStats(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isActive: true },
      select: { rating: true, verified: true },
    });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const distribution = [1, 2, 3, 4, 5].map((s) => ({
      stars: s,
      count: reviews.filter((r) => r.rating === s).length,
    }));
    return { average: Math.round(avg * 10) / 10, total: reviews.length, distribution, verifiedCount: reviews.filter((r) => r.verified).length };
  }

  async add(userId: string, productId: string, data: { rating: number; title?: string; body: string; images?: string[] }) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");

    // Verify purchase
    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: "DELIVERED" },
      },
    });

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        verified: !!hasPurchased,
      },
    });

    if (data.images?.length) {
      await this.prisma.reviewMedia.createMany({
        data: data.images.map((url) => ({ reviewId: review.id, url, type: "image" })),
      });
    }

    await this.updateProductRating(productId);
    return review;
  }

  async addSellerReview(userId: string, sellerId: string, data: {
    rating: number;
    title?: string;
    body: string;
    orderId?: string;
  }) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException("Seller not found");

    // Verify purchase from this seller
    if (data.orderId) {
      const hasOrder = await this.prisma.order.findFirst({
        where: { id: data.orderId, userId, sellerId, status: "DELIVERED" },
      });
      if (!hasOrder) throw new ForbiddenException("You can only review sellers you have purchased from");
    }

    const review = await this.prisma.sellerReview.create({
      data: {
        userId,
        sellerId,
        orderId: data.orderId,
        rating: data.rating,
        title: data.title,
        body: data.body,
      },
    });

    // Update seller rating
    const stats = await this.prisma.sellerReview.aggregate({
      where: { sellerId, isActive: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.seller.update({
      where: { id: sellerId },
      data: {
        rating: Math.round((stats._avg.rating || 0) * 10) / 10,
        ratingCount: stats._count.rating,
      },
    });

    return review;
  }

  async getReviewsByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { id: true, title: true, slug: true, images: { take: 1 } } }, media: true },
      }),
      this.prisma.review.count({ where: { userId } }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async moderateReview(reviewId: string, isActive: boolean) {
    return this.prisma.review.update({ where: { id: reviewId }, data: { isActive } });
  }

  private async updateProductRating(productId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { productId, isActive: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: { rating: Math.round((stats._avg.rating || 0) * 10) / 10, ratingCount: stats._count.rating, reviewCount: stats._count.rating },
    });
  }
}
