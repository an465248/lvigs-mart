import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AiContext } from "./ai.types";

@Injectable()
export class AiContextService {
  constructor(private prisma: PrismaService) {}

  async buildContext(userId: string | null, sessionId: string): Promise<AiContext> {
    const [conversationHistory, userPreferences, cartItems, recentlyViewed] = await Promise.all([
      this.getConversationHistory(userId, sessionId),
      userId ? this.getUserPreferences(userId) : Promise.resolve(null),
      userId ? this.getCartItems(userId) : Promise.resolve([]),
      userId ? this.getRecentlyViewed(userId) : Promise.resolve([]),
    ]);

    return {
      userId,
      sessionId,
      conversationHistory,
      userPreferences,
      cartItems,
      recentlyViewed,
    };
  }

  private async getConversationHistory(
    userId: string | null,
    sessionId: string,
  ): Promise<{ role: string; content: string }[]> {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: userId
        ? { userId, sessionId }
        : { sessionId, userId: null },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!conversation) return [];

    return conversation.messages.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  private async getUserPreferences(userId: string): Promise<Record<string, any> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        locale: true,
        gender: true,
      },
    });

    if (!user) return null;

    const orderCategories = await this.prisma.orderItem.findMany({
      where: {
        order: { userId, status: "DELIVERED" },
      },
      select: {
        product: {
          select: {
            category: { select: { name: true } },
            brand: { select: { name: true } },
          },
        },
      },
      take: 20,
      orderBy: { order: { createdAt: "desc" } },
    });

    const categoryCounts: Record<string, number> = {};
    const brandCounts: Record<string, number> = {};

    for (const item of orderCategories) {
      const catName = item.product?.category?.name;
      const brandName = item.product?.brand?.name;
      if (catName) categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      if (brandName) brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
    }

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    return {
      name: user.name,
      locale: user.locale,
      preferredCategories: topCategories,
      preferredBrands: topBrands,
    };
  }

  private async getCartItems(
    userId: string,
  ): Promise<{ productId: string; title: string; price: number; quantity: number }[]> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { savedForLater: false },
          include: {
            product: {
              select: { id: true, title: true, price: true },
            },
          },
        },
      },
    });

    if (!cart) return [];

    return cart.items
      .filter((i) => i.product)
      .map((i) => ({
        productId: i.product.id,
        title: i.product.title,
        price: i.product.price,
        quantity: i.quantity,
      }));
  }

  private async getRecentlyViewed(
    userId: string,
  ): Promise<{ productId: string; title: string; price: number }[]> {
    const viewed = await this.prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: 10,
    });

    if (viewed.length === 0) return [];

    const productIds = viewed.map((v) => v.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, price: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return viewed
      .map((v) => {
        const product = productMap.get(v.productId);
        if (!product) return null;
        return {
          productId: product.id,
          title: product.title,
          price: product.price,
        };
      })
      .filter((item): item is { productId: string; title: string; price: number } => item !== null);
  }
}
