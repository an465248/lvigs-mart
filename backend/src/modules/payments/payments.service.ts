import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import Razorpay from "razorpay";

@Injectable()
export class PaymentsService {
  private razor: Razorpay | null = null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private config: ConfigService, private prisma: PrismaService) {
    const keyId = this.config.get("RAZORPAY_KEY_ID");
    const keySecret = this.config.get("RAZORPAY_KEY_SECRET");
    if (keyId && keySecret) {
      this.razor = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async createOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    if (!this.razor) {
      return { id: "order_dev_" + orderId.slice(0, 10), amount: Math.round(order.total * 100), currency: "INR" };
    }

    const rpOrder = await this.razor.orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order.shortId,
      notes: { orderId: order.id },
    });
    await this.prisma.orderPayment.update({
      where: { orderId: order.id },
      data: { gatewayRef: rpOrder.id },
    });
    return rpOrder;
  }

  async verifyPayment(orderId: string, payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundException("Order not found");

    if (order.paymentStatus === "SUCCESS" && order.payment?.status === "SUCCESS") {
      return { ok: true };
    }

    if (!this.razor) {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: "SUCCESS", status: "CONFIRMED" },
        });
        await tx.orderPayment.update({
          where: { orderId },
          data: { status: "SUCCESS", payload: payload as any },
        });
        await tx.orderStatusHistory.create({ data: { orderId, status: "CONFIRMED", note: "Payment verified (dev)" } });
      });
      return { ok: true };
    }

    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", this.config.get("RAZORPAY_KEY_SECRET")!)
      .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== payload.razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: "SUCCESS", status: "CONFIRMED" },
      });
      await tx.orderPayment.update({
        where: { orderId },
        data: { status: "SUCCESS", gatewayRef: payload.razorpay_payment_id, payload: payload as any },
      });
      await tx.orderStatusHistory.create({ data: { orderId, status: "CONFIRMED", note: "Payment verified" } });
    });

    return { ok: true };
  }

  async handleWebhook(body: any, signature: string) {
    if (!this.razor) return { ok: true };

    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", this.config.get("RAZORPAY_KEY_SECRET")!)
      .update(JSON.stringify(body))
      .digest("hex");
    if (expected !== signature) throw new Error("Invalid webhook signature");

    const eventId: string | undefined = body.id;
    const eventType: string = body.event || "unknown";

    if (eventId) {
      try {
        const existing = await this.prisma.webhookEvent.findUnique({ where: { eventId } });
        if (existing?.processed) {
          return { ok: true, message: "Already processed" };
        }
      } catch (err) {
        this.logger.warn(`WebhookEvent lookup failed for ${eventId}, proceeding without dedup: ${err}`);
      }
    }

    try {
      if (body.event === "payment.captured") {
        const orderId = body.payload.payment.entity.notes?.orderId;
        if (orderId) {
          await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({ where: { id: orderId } });
            if (order && order.paymentStatus !== "SUCCESS") {
              await tx.order.update({
                where: { id: orderId },
                data: { paymentStatus: "SUCCESS", status: "CONFIRMED" },
              });
              await tx.orderStatusHistory.create({ data: { orderId, status: "CONFIRMED", note: "Webhook: payment captured" } });
            }
          });
        }
      }
    } catch (err) {
      this.logger.error(`Webhook processing failed for event ${eventId || eventType}: ${err}`);
    }

    if (eventId) {
      try {
        await this.prisma.webhookEvent.upsert({
          where: { eventId },
          create: {
            eventId,
            provider: "razorpay",
            eventType,
            processed: true,
            payload: body as any,
            processedAt: new Date(),
          },
          update: {
            processed: true,
            payload: body as any,
            processedAt: new Date(),
          },
        });
      } catch (err) {
        this.logger.error(`Failed to record webhook event ${eventId}: ${err}`);
      }
    }

    return { ok: true };
  }
}
