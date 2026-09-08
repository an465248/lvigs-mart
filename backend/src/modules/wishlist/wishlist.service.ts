import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreate(userId: string) {
    let w = await this.prisma.wishlist.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
    if (!w) w = await this.prisma.wishlist.create({ data: { userId }, include: { items: { include: { product: true } } } });
    return w;
  }

  async get(userId: string) {
    return this.getOrCreate(userId);
  }

  async toggle(userId: string, productId: string) {
    const w = await this.getOrCreate(userId);
    const existing = w.items.find((i) => i.productId === productId);
    if (existing) {
      await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
      return { wishlisted: false };
    } else {
      await this.prisma.wishlistItem.create({ data: { wishlistId: w.id, productId } });
      return { wishlisted: true };
    }
  }
}