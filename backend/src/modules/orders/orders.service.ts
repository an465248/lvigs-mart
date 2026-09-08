import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CouponsService } from "../coupons/coupons.service";
import { CartService } from "../cart/cart.service";
import { PlaceOrderDto } from "./dto/order.dto";
import { nanoid } from "nanoid";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private coupons: CouponsService,
    private cart: CartService
  ) {}

  private async computeTotals(items: any[], couponCode?: string) {
    const itemTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const mrpTotal = items.reduce((s, i) => s + i.mrp * i.quantity, 0);
    const itemDiscount = mrpTotal - itemTotal;
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await this.coupons.validate(couponCode, itemTotal);
      if (coupon) couponDiscount = coupon.discount;
    }
    const deliveryFee = itemTotal >= 499 ? 0 : 49;
    const tax = Math.round(itemTotal * 0.05);
    const payable = itemTotal - couponDiscount + deliveryFee + tax;
    return {
      itemTotal,
      mrpTotal,
      itemDiscount,
      couponDiscount,
      deliveryFee,
      tax,
      payable,
      savings: mrpTotal - payable,
    };
  }

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.idempotencyKey.findUnique({
        where: { key: dto.idempotencyKey },
      });

      if (existing) {
        if (existing.status === "COMPLETED" && existing.response) {
          return existing.response as any;
        }
        if (existing.status === "PENDING") {
          throw new ConflictException("Order is already being processed");
        }
        if (existing.status === "FAILED") {
          throw new ConflictException("Previous order attempt failed. Please retry without idempotency key.");
        }
      }

      await this.prisma.idempotencyKey.create({
        data: {
          key: dto.idempotencyKey,
          userId,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                mrp: true,
                images: { select: { url: true }, take: 1 },
              },
            },
            variant: true,
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      throw new NotFoundException("Cart is empty");
    }

    const address = await this.prisma.userAddress.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) {
      throw new NotFoundException("Address not found");
    }

    const items = cart.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      title: i.product.title,
      image: i.product.images[0]?.url || "",
      quantity: i.quantity,
      price: i.product.price,
      mrp: i.product.mrp,
    }));

    const totals = await this.computeTotals(items, dto.couponCode);

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        for (const item of items) {
          const inventoryWhere: any = { productId: item.productId };
          if (item.variantId) {
            inventoryWhere.variantId = item.variantId;
          } else {
            inventoryWhere.variantId = null;
          }

          const inventoryRecord = await tx.inventory.findFirst({
            where: inventoryWhere,
          });

          if (!inventoryRecord) {
            throw new BadRequestException(
              `Inventory record not found for product "${item.title}"`
            );
          }

          if (inventoryRecord.quantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for "${item.title}". Available: ${inventoryRecord.quantity}, requested: ${item.quantity}`
            );
          }

          const updateResult = await tx.inventory.updateMany({
            where: {
              id: inventoryRecord.id,
              quantity: { gte: item.quantity },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          if (updateResult.count === 0) {
            throw new BadRequestException(
              `Stock changed for "${item.title}". Please try again.`
            );
          }

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              variantId: item.variantId || null,
              warehouseId: inventoryRecord.warehouseId,
              type: "SOLD",
              quantity: item.quantity,
              notes: `Order placed - deducted ${item.quantity} units`,
            },
          });
        }

        const shortId = "LVIGS-" + nanoid(8);

        const order = await tx.order.create({
          data: {
            shortId,
            userId,
            addressId: address.id,
            paymentMethod: dto.paymentMethod as any,
            paymentStatus: dto.paymentMethod === "COD" ? "PENDING" : "SUCCESS",
            couponCode: dto.couponCode,
            couponDiscount: totals.couponDiscount,
            itemTotal: totals.itemTotal,
            deliveryFee: totals.deliveryFee,
            tax: totals.tax,
            total: totals.payable,
            status: "PLACED",
            expectedDelivery: new Date(Date.now() + 4 * 86400_000),
            items: {
              create: items.map((i) => {
                const { productId, image, ...rest } = i;
                return {
                  ...rest,
                  image: image || "",
                  product: { connect: { id: productId } },
                };
              }),
            },
            payment: {
              create: {
                method: dto.paymentMethod as any,
                status: dto.paymentMethod === "COD" ? "PENDING" : "SUCCESS",
                gateway: "razorpay",
                amount: totals.payable,
              },
            },
          },
          include: { items: true, payment: true, address: true },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "PLACED",
            note: "Order placed successfully",
          },
        });

        if (cart.couponCode) {
          await tx.coupon.update({
            where: { code: cart.couponCode.toUpperCase() },
            data: { usedCount: { increment: 1 } },
          });
        }

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({
          where: { id: cart.id },
          data: { couponCode: null },
        });

        return order;
      });

      if (dto.idempotencyKey) {
        await this.prisma.idempotencyKey.update({
          where: { key: dto.idempotencyKey },
          data: {
            status: "COMPLETED",
            orderId: order.id,
            response: order as any,
          },
        });
      }

      return order;
    } catch (error) {
      if (dto.idempotencyKey && !(error instanceof ConflictException)) {
        await this.prisma.idempotencyKey.update({
          where: { key: dto.idempotencyKey },
          data: { status: "FAILED" },
        }).catch(() => {});
      }
      throw error;
    }
  }

  async getOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, images: true } },
          },
        },
        payment: true,
        address: true,
      },
    });
  }

  async getOrder(userId: string, id: string) {
    return this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, images: true } },
            variant: true,
          },
        },
        payment: true,
        address: true,
        shipments: { include: { tracking: { orderBy: { at: "asc" } } } },
      },
    });
  }

  async cancelOrder(userId: string, id: string, reason: string) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException("Order not found");
    if (!["PLACED", "CONFIRMED", "PACKED"].includes(order.status)) {
      throw new Error("Order cannot be cancelled at this stage");
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: id, status: "CANCELLED", note: reason },
      });

      const orderItems = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of orderItems) {
        const inventoryWhere: any = { productId: item.productId };
        if (item.variantId) {
          inventoryWhere.variantId = item.variantId;
        } else {
          inventoryWhere.variantId = null;
        }

        const inventoryRecord = await tx.inventory.findFirst({
          where: inventoryWhere,
        });

        if (inventoryRecord) {
          await tx.inventory.update({
            where: { id: inventoryRecord.id },
            data: { quantity: { increment: item.quantity } },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              variantId: item.variantId || null,
              warehouseId: inventoryRecord.warehouseId,
              type: "RETURNED",
              quantity: item.quantity,
              referenceId: id,
              notes: `Order cancelled - restored ${item.quantity} units`,
            },
          });
        }
      }

      if (order.couponCode) {
        await tx.coupon.update({
          where: { code: order.couponCode.toUpperCase() },
          data: { usedCount: { decrement: 1 } },
        }).catch(() => {});
      }

      return updated;
    });
  }
}
