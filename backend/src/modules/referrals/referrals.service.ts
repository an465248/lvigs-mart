import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
import { LoyaltyService } from "../loyalty/loyalty.service";

const CODE_LENGTH = 8;
const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const REFERRER_BONUS = 100;
const WELCOME_BONUS = 50;

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private loyalty: LoyaltyService,
  ) {}

  async generateCode(userId: string): Promise<{ code: string }> {
    const existing = await this.prisma.referral.findFirst({
      where: { userId },
    });
    if (existing) {
      return { code: existing.code };
    }

    let code: string;
    let attempts = 0;
    do {
      code = this.randomCode();
      attempts++;
      if (attempts > 10) {
        throw new Error("Failed to generate unique referral code");
      }
    } while (!(await this.isCodeUnique(code)));

    const referral = await this.prisma.referral.create({
      data: {
        userId,
        code,
        bonusAmount: REFERRER_BONUS,
      },
    });

    return { code: referral.code };
  }

  async getByCode(code: string) {
    return this.prisma.referral.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  async attribute(
    referredUserId: string,
    referralCode: string,
    ip: string,
    userAgent?: string,
  ): Promise<void> {
    const referral = await this.getByCode(referralCode);
    if (!referral) {
      throw new BadRequestException("Invalid referral code");
    }

    if (referral.userId === referredUserId) {
      throw new BadRequestException("Cannot refer yourself");
    }

    const existingEvent = await this.prisma.referralEvent.findFirst({
      where: {
        referralId: referral.id,
        referredUserId,
        event: "SIGNUP",
      },
    });

    if (existingEvent) {
      throw new ConflictException("Referral already attributed");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.referral.update({
        where: { id: referral.id },
        data: { totalReferred: { increment: 1 } },
      });

      await tx.referralEvent.create({
        data: {
          referralId: referral.id,
          referredUserId,
          event: "SIGNUP",
          ipAddress: ip,
          userAgent,
        },
      });
    });

    this.logger.log(
      `Referral attributed: ${referredUserId} referred by ${referral.userId}`,
    );
  }

  async completeReferral(referredUserId: string): Promise<void> {
    const event = await this.prisma.referralEvent.findFirst({
      where: {
        referredUserId,
        event: "SIGNUP",
      },
    });

    if (!event) {
      throw new BadRequestException("No pending referral for this user");
    }

    const completedEvent = await this.prisma.referralEvent.findFirst({
      where: {
        referredUserId,
        event: "FIRST_PURCHASE",
      },
    });

    if (completedEvent) {
      throw new ConflictException("Referral already completed");
    }

    const referral = await this.prisma.referral.findUnique({
      where: { id: event.referralId },
    });

    if (!referral) {
      throw new BadRequestException("Referral record not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.referralEvent.create({
        data: {
          referralId: event.referralId,
          referredUserId,
          event: "FIRST_PURCHASE",
        },
      });

      await tx.referralEvent.create({
        data: {
          referralId: event.referralId,
          referredUserId,
          event: "REWARD_ISSUED",
        },
      });

      await tx.referralReward.create({
        data: {
          referralId: event.referralId,
          referredUserId,
          amount: REFERRER_BONUS,
          status: "SETTLED",
          settledAt: new Date(),
        },
      });

      await tx.referral.update({
        where: { id: event.referralId },
        data: {
          totalEarned: { increment: REFERRER_BONUS },
        },
      });
    });

    await this.loyalty.earnPoints(
      referral.userId,
      REFERRER_BONUS,
      "BONUS",
      "Referral bonus",
      "REFERRAL",
      referredUserId,
    );

    await this.loyalty.earnPoints(
      referredUserId,
      WELCOME_BONUS,
      "BONUS",
      "Welcome bonus via referral",
      "REFERRAL",
      event.referralId,
    );

    this.logger.log(
      `Referral completed: ${referredUserId}, referrer ${referral.userId} earned ${REFERRER_BONUS} points`,
    );
  }

  async getReferralStats(userId: string) {
    const referral = await this.prisma.referral.findFirst({
      where: { userId },
    });

    if (!referral) {
      return {
        code: null,
        totalReferred: 0,
        totalEarned: 0,
        pendingRewards: 0,
      };
    }

    const pendingRewards = await this.prisma.referralReward.aggregate({
      where: {
        referralId: referral.id,
        status: "PENDING",
      },
      _sum: { amount: true },
    });

    return {
      code: referral.code,
      totalReferred: referral.totalReferred,
      totalEarned: referral.totalEarned,
      pendingRewards: pendingRewards._sum.amount || 0,
    };
  }

  async getRewardHistory(userId: string, page = 1, limit = 20) {
    const referral = await this.prisma.referral.findFirst({
      where: { userId },
    });

    if (!referral) {
      return { items: [], pagination: { page, limit, total: 0, pages: 0 } };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.referralReward.findMany({
        where: { referralId: referral.id },
        orderBy: { earnedAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.referralReward.count({
        where: { referralId: referral.id },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private randomCode(): string {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS.charAt(
        Math.floor(Math.random() * CODE_CHARS.length),
      );
    }
    return code;
  }

  private async isCodeUnique(code: string): Promise<boolean> {
    const existing = await this.prisma.referral.findUnique({
      where: { code },
    });
    return !existing;
  }
}
