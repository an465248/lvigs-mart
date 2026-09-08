import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  async listPlans() {
    return this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async getCurrentSubscription(userId: string) {
    return this.prisma.membershipSubscription.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async subscribe(userId: string, planId: string, billingCycle: string = "MONTHLY") {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new BadRequestException("Invalid or inactive plan");
    }

    const existing = await this.prisma.membershipSubscription.findFirst({
      where: { userId, status: "ACTIVE" },
    });
    if (existing) {
      throw new BadRequestException("You already have an active subscription. Cancel it first.");
    }

    const now = new Date();
    const endDate = new Date(now);
    if (billingCycle === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    return this.prisma.membershipSubscription.create({
      data: {
        userId,
        planId,
        billingCycle,
        startDate: now,
        endDate,
        status: "ACTIVE",
      },
      include: { plan: true },
    });
  }

  async cancel(userId: string) {
    const subscription = await this.prisma.membershipSubscription.findFirst({
      where: { userId, status: "ACTIVE" },
    });

    if (!subscription) {
      throw new BadRequestException("No active subscription found");
    }

    return this.prisma.membershipSubscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED", autoRenew: false },
      include: { plan: true },
    });
  }
}
