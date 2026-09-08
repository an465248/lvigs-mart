import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  // Delivery Agent Registration
  async registerAgent(userId: string, dto: {
    vehicleType?: string;
    vehicleNumber?: string;
  }) {
    const existing = await this.prisma.deliveryAgent.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException("Already registered as delivery agent");

    const agentCode = `DA-${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const agent = await tx.deliveryAgent.create({
        data: {
          userId,
          agentCode,
          vehicleType: dto.vehicleType,
          vehicleNumber: dto.vehicleNumber,
          status: "PENDING",
        },
      });

      await tx.auditLog.create({
        data: { actorId: userId, actorRole: "DELIVERY_AGENT", action: "AGENT_REGISTERED", resource: "deliveryAgent", resourceId: agent.id },
      });

      return agent;
    });
  }

  async getAgentProfile(userId: string) {
    const agent = await this.prisma.deliveryAgent.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, mobile: true, email: true, avatar: true } } },
    });
    if (!agent) throw new NotFoundException("Delivery agent not found");
    return agent;
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    const agent = await this.prisma.deliveryAgent.findUnique({ where: { userId } });
    if (!agent) throw new NotFoundException("Delivery agent not found");

    return this.prisma.deliveryAgent.update({
      where: { id: agent.id },
      data: { currentLat: lat, currentLng: lng },
    });
  }

  async toggleAvailability(userId: string, isAvailable: boolean) {
    const agent = await this.prisma.deliveryAgent.findUnique({ where: { userId } });
    if (!agent) throw new NotFoundException("Delivery agent not found");

    return this.prisma.deliveryAgent.update({
      where: { id: agent.id },
      data: { isAvailable },
    });
  }

  // Get assigned deliveries
  async getAssignedDeliveries(userId: string, page = 1, limit = 20) {
    const agent = await this.prisma.deliveryAgent.findUnique({ where: { userId } });
    if (!agent) throw new NotFoundException("Delivery agent not found");

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where: { agentId: agent.id },
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: {
              items: { select: { title: true, image: true, quantity: true, price: true } },
              address: true,
              user: { select: { name: true, mobile: true } },
            },
          },
          tracking: { orderBy: { at: "desc" }, take: 1 },
        },
      }),
      this.prisma.shipment.count({ where: { agentId: agent.id } }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // Accept delivery
  async acceptDelivery(userId: string, shipmentId: string) {
    const agent = await this.prisma.deliveryAgent.findUnique({ where: { userId } });
    if (!agent) throw new NotFoundException("Delivery agent not found");
    if (agent.status !== "ACTIVE") throw new ForbiddenException("Agent account is not active");

    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException("Shipment not found");
    if (shipment.agentId && shipment.agentId !== agent.id) throw new ForbiddenException("Shipment assigned to another agent");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: { agentId: agent.id, status: "IN_TRANSIT" },
      });

      await tx.shipmentEvent.create({
        data: { shipmentId, status: "PICKED_UP", message: "Package picked up by delivery agent" },
      });

      await tx.deliveryTracking.create({
        data: {
          shipmentId,
          orderId: shipment.orderId,
          status: "PICKED_UP",
          message: "Package picked up",
          lat: agent.currentLat,
          lng: agent.currentLng,
        },
      });

      return updated;
    });
  }

  // Update delivery status
  async updateDeliveryStatus(userId: string, shipmentId: string, status: string, notes?: string) {
    const agent = await this.prisma.deliveryAgent.findUnique({ where: { userId } });
    if (!agent) throw new NotFoundException("Delivery agent not found");

    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, agentId: agent.id },
    });
    if (!shipment) throw new NotFoundException("Shipment not found or not assigned to you");

    const statusMap: Record<string, any> = {
      IN_TRANSIT: "IN_TRANSIT",
      OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
      DELIVERED: "DELIVERED",
      FAILED: "FAILED",
    };

    const shipmentStatus = statusMap[status];
    if (!shipmentStatus) throw new BadRequestException("Invalid status");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: shipmentStatus,
          deliveryStatus: status as any,
          deliveredAt: status === "DELIVERED" ? new Date() : undefined,
        },
      });

      await tx.shipmentEvent.create({
        data: { shipmentId, status: status as any, message: notes || `Status updated to ${status}` },
      });

      await tx.deliveryTracking.create({
        data: {
          shipmentId,
          orderId: shipment.orderId,
          status,
          message: notes || `Status: ${status}`,
          lat: agent.currentLat,
          lng: agent.currentLng,
        },
      });

      if (status === "DELIVERED") {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { status: "DELIVERED", deliveredAt: new Date() },
        });
        await tx.deliveryAgent.update({
          where: { id: agent.id },
          data: { totalDeliveries: { increment: 1 } },
        });
      }

      return updated;
    });
  }

  // Report failed delivery
  async reportFailedDelivery(userId: string, shipmentId: string, reason: string) {
    const agent = await this.prisma.deliveryAgent.findUnique({ where: { userId } });
    if (!agent) throw new NotFoundException("Delivery agent not found");

    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, agentId: agent.id },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");

    return this.prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id: shipmentId },
        data: { status: "FAILED", deliveryStatus: "DELIVERY_FAILED" },
      });

      await tx.shipmentEvent.create({
        data: { shipmentId, status: "FAILED", message: reason },
      });

      await tx.deliveryTracking.create({
        data: { shipmentId, orderId: shipment.orderId, status: "DELIVERY_FAILED", message: reason },
      });

      return { success: true };
    });
  }

  // Get delivery details (pickup & delivery addresses)
  async getDeliveryDetails(userId: string, shipmentId: string) {
    const agent = await this.prisma.deliveryAgent.findUnique({ where: { userId } });
    if (!agent) throw new NotFoundException("Delivery agent not found");

    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, agentId: agent.id },
      include: {
        order: {
          include: {
            address: true,
            user: { select: { name: true, mobile: true } },
            items: { select: { title: true, quantity: true } },
          },
        },
        tracking: { orderBy: { at: "desc" } },
      },
    });

    if (!shipment) throw new NotFoundException("Shipment not found");
    return shipment;
  }

  // Agent dashboard
  async getAgentDashboard(userId: string) {
    const agent = await this.prisma.deliveryAgent.findUnique({ where: { userId } });
    if (!agent) throw new NotFoundException("Delivery agent not found");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalDeliveries, todayDeliveries, pendingDeliveries, failedDeliveries, activeDeliveries] = await Promise.all([
      this.prisma.shipment.count({ where: { agentId: agent.id, status: "DELIVERED" } }),
      this.prisma.shipment.count({ where: { agentId: agent.id, status: "DELIVERED", deliveredAt: { gte: todayStart } } }),
      this.prisma.shipment.count({ where: { agentId: agent.id, status: { in: ["CREATED", "IN_TRANSIT"] } } }),
      this.prisma.shipment.count({ where: { agentId: agent.id, status: "FAILED" } }),
      this.prisma.shipment.count({ where: { agentId: agent.id, status: { in: ["IN_TRANSIT", "OUT_FOR_DELIVERY"] } } }),
    ]);

    return {
      stats: {
        totalDeliveries,
        todayDeliveries,
        pendingDeliveries,
        failedDeliveries,
        activeDeliveries,
        rating: agent.rating,
        isAvailable: agent.isAvailable,
      },
      agent,
    };
  }
}
