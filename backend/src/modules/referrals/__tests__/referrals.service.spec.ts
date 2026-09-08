import { Test, TestingModule } from "@nestjs/testing";
import { ReferralsService } from "../referrals.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../common/redis/redis.service";
import { LoyaltyService } from "../../loyalty/loyalty.service";
import { BadRequestException, ConflictException } from "@nestjs/common";

describe("ReferralsService", () => {
  let service: ReferralsService;
  let prisma: any;
  let redis: any;
  let loyalty: any;

  const mockPrisma = {
    referral: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    referralEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    referralReward: {
      create: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRedis = {
    cacheGet: jest.fn(),
    cacheSet: jest.fn(),
    del: jest.fn(),
  };

  const mockLoyalty = {
    earnPoints: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: LoyaltyService, useValue: mockLoyalty },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    loyalty = module.get(LoyaltyService);
  });

  describe("generateCode", () => {
    it("should create a unique code for new user", async () => {
      prisma.referral.findFirst.mockResolvedValue(null);
      prisma.referral.findUnique.mockResolvedValue(null);
      prisma.referral.create.mockResolvedValue({ code: "ABC12345" });

      const result = await service.generateCode("user-1");
      expect(result.code).toBe("ABC12345");
      expect(prisma.referral.create).toHaveBeenCalled();
    });

    it("should return existing code if user already has one", async () => {
      prisma.referral.findFirst.mockResolvedValue({ code: "EXISTING1" });

      const result = await service.generateCode("user-1");
      expect(result.code).toBe("EXISTING1");
      expect(prisma.referral.create).not.toHaveBeenCalled();
    });

    it("should retry if code is not unique", async () => {
      prisma.referral.findFirst.mockResolvedValue(null);
      prisma.referral.findUnique
        .mockResolvedValueOnce({ id: "exists" })
        .mockResolvedValueOnce(null);
      prisma.referral.create.mockResolvedValue({ code: "UNIQUE01" });

      const result = await service.generateCode("user-1");
      expect(result.code).toBe("UNIQUE01");
      expect(prisma.referral.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe("getByCode", () => {
    it("should find a valid referral code", async () => {
      const mockReferral = { id: "ref-1", code: "ABC12345", userId: "user-1" };
      prisma.referral.findUnique.mockResolvedValue(mockReferral);

      const result = await service.getByCode("ABC12345");
      expect(result).toEqual(mockReferral);
      expect(prisma.referral.findUnique).toHaveBeenCalledWith({
        where: { code: "ABC12345" },
      });
    });

    it("should return null for invalid code", async () => {
      prisma.referral.findUnique.mockResolvedValue(null);

      const result = await service.getByCode("INVALID");
      expect(result).toBeNull();
    });

    it("should uppercase the code before lookup", async () => {
      prisma.referral.findUnique.mockResolvedValue(null);

      await service.getByCode("abc12345");
      expect(prisma.referral.findUnique).toHaveBeenCalledWith({
        where: { code: "ABC12345" },
      });
    });
  });

  describe("completeReferral", () => {
    it("should award points on successful referral completion", async () => {
      const mockEvent = {
        id: "evt-1",
        referralId: "ref-1",
        referredUserId: "user-2",
        event: "SIGNUP",
      };
      const mockReferral = {
        id: "ref-1",
        userId: "user-1",
        code: "ABC12345",
      };

      prisma.referralEvent.findFirst
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(null);
      prisma.referral.findUnique.mockResolvedValue(mockReferral);
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          referralEvent: { create: jest.fn() },
          referralReward: { create: jest.fn() },
          referral: { update: jest.fn() },
        });
      });

      await service.completeReferral("user-2");

      expect(loyalty.earnPoints).toHaveBeenCalledTimes(2);
      expect(loyalty.earnPoints).toHaveBeenCalledWith(
        "user-1",
        100,
        "BONUS",
        "Referral bonus",
        "REFERRAL",
        "user-2",
      );
      expect(loyalty.earnPoints).toHaveBeenCalledWith(
        "user-2",
        50,
        "BONUS",
        "Welcome bonus via referral",
        "REFERRAL",
        "ref-1",
      );
    });

    it("should throw if no pending referral found", async () => {
      prisma.referralEvent.findFirst.mockResolvedValue(null);

      await expect(service.completeReferral("user-2")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw if referral already completed", async () => {
      prisma.referralEvent.findFirst
        .mockResolvedValueOnce({ id: "evt-1" })
        .mockResolvedValueOnce({ id: "evt-2", event: "FIRST_PURCHASE" });

      await expect(service.completeReferral("user-2")).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("self-referral prevention", () => {
    it("should throw when user refers themselves", async () => {
      const mockReferral = { id: "ref-1", userId: "user-1", code: "ABC12345" };
      prisma.referral.findUnique.mockResolvedValue(mockReferral);

      await expect(
        service.attribute("user-1", "ABC12345", "127.0.0.1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("attribute", () => {
    it("should throw for invalid referral code", async () => {
      prisma.referral.findUnique.mockResolvedValue(null);

      await expect(
        service.attribute("user-2", "INVALID", "127.0.0.1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if referral already attributed", async () => {
      const mockReferral = { id: "ref-1", userId: "user-1", code: "ABC12345" };
      prisma.referral.findUnique.mockResolvedValue(mockReferral);
      prisma.referralEvent.findFirst.mockResolvedValue({ id: "existing" });

      await expect(
        service.attribute("user-2", "ABC12345", "127.0.0.1"),
      ).rejects.toThrow(ConflictException);
    });

    it("should record referral event on success", async () => {
      const mockReferral = { id: "ref-1", userId: "user-1", code: "ABC12345" };
      prisma.referral.findUnique.mockResolvedValue(mockReferral);
      prisma.referralEvent.findFirst.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          referral: { update: jest.fn() },
          referralEvent: { create: jest.fn() },
        });
      });

      await service.attribute("user-2", "ABC12345", "127.0.0.1", "Mozilla/5.0");
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
