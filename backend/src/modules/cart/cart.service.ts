import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AddToCartDto, UpdateCartItemDto } from "./dto/cart.dto";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true, variant: true } } } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId }, include: { items: { include: { product: true, variant: true } } } });
    }
    return cart;
  }

  async getCart(userId: string) {
    return this.getOrCreateCart(userId);
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException("Product not found");
    if (!product.isActive || !product.isApproved) throw new NotFoundException("Product not available");

    const variant = dto.variantId
      ? await this.prisma.productVariant.findUnique({ where: { id: dto.variantId } })
      : null;

    const existing = cart.items.find(
      (i) => i.productId === dto.productId && i.variantId === dto.variantId && !i.savedForLater
    );

    // Check available stock
    const inventory = await this.prisma.inventory.findFirst({
      where: { productId: dto.productId, ...(dto.variantId ? { variantId: dto.variantId } : {}) },
    });
    const availableStock = inventory ? inventory.quantity - inventory.reserved : product.stock;
    const currentQtyInCart = existing ? existing.quantity : 0;
    const requestedQty = dto.quantity || 1;

    if (currentQtyInCart + requestedQty > availableStock) {
      throw new BadRequestException(`Insufficient stock. Only ${availableStock} available.`);
    }

    if (existing) {
      const newQty = Math.min(existing.quantity + (dto.quantity || 1), 10);
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity || 1,
        },
      });
    }
    return this.getOrCreateCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException("Cart item not found");
    if (dto.quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const inventory = await this.prisma.inventory.findFirst({
        where: { productId: item.productId, ...(item.variantId ? { variantId: item.variantId } : {}) },
      });
      const availableStock = inventory ? inventory.quantity - inventory.reserved : item.product.stock;

      if (dto.quantity > availableStock) {
        throw new BadRequestException(`Insufficient stock. Only ${availableStock} available.`);
      }

      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: Math.min(dto.quantity, 10) } });
    }
    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException("Cart item not found");
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cart: { userId } } });
    return { ok: true };
  }

  async applyCoupon(userId: string, code: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cart.update({ where: { userId }, data: { couponCode: code.toUpperCase() } });
    return this.getOrCreateCart(userId);
  }

  async removeCoupon(userId: string) {
    await this.prisma.cart.update({ where: { userId }, data: { couponCode: null } });
    return this.getOrCreateCart(userId);
  }
}
