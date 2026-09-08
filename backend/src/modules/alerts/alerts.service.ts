import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createPriceAlert(userId: string, productId: string, targetPrice: number) {
    return this.prisma.priceAlert.upsert({
      where: { userId_productId: { userId, productId } },
      update: { targetPrice, triggered: false, triggeredAt: null },
      create: { userId, productId, targetPrice },
    });
  }

  async removePriceAlert(userId: string, id: string) {
    return this.prisma.priceAlert.deleteMany({ where: { id, userId } });
  }

  async listPriceAlerts(userId: string) {
    return this.prisma.priceAlert.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, slug: true, title: true, price: true, mrp: true, images: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createStockAlert(userId: string, productId: string) {
    return this.prisma.stockAlert.upsert({
      where: { userId_productId: { userId, productId } },
      update: { triggered: false, triggeredAt: null },
      create: { userId, productId },
    });
  }

  async removeStockAlert(userId: string, id: string) {
    return this.prisma.stockAlert.deleteMany({ where: { id, userId } });
  }

  async listStockAlerts(userId: string) {
    return this.prisma.stockAlert.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, slug: true, title: true, price: true, mrp: true, images: true, stock: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async checkPriceAlerts(productId: string, newPrice: number) {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { productId, triggered: false, targetPrice: { gte: newPrice } },
    });

    for (const alert of alerts) {
      await this.prisma.priceAlert.update({
        where: { id: alert.id },
        data: { triggered: true, triggeredAt: new Date() },
      });

      await this.notifications.send(
        alert.userId,
        "PRICE",
        "Price Alert!",
        `Product price dropped to ₹${newPrice.toLocaleString("en-IN")} (your target: ₹${alert.targetPrice.toLocaleString("en-IN")})`,
        `/product/${productId}`,
        { productId, targetPrice: alert.targetPrice, currentPrice: newPrice },
      );
    }

    return alerts.length;
  }

  async checkStockAlerts(productId: string, stock: number) {
    if (stock <= 0) return 0;

    const alerts = await this.prisma.stockAlert.findMany({
      where: { productId, triggered: false },
    });

    for (const alert of alerts) {
      await this.prisma.stockAlert.update({
        where: { id: alert.id },
        data: { triggered: true, triggeredAt: new Date() },
      });

      await this.notifications.send(
        alert.userId,
        "STOCK",
        "Back in Stock!",
        `Product you were waiting for is now back in stock!`,
        `/product/${productId}`,
        { productId },
      );
    }

    return alerts.length;
  }
}
