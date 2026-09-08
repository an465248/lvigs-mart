import { Test, TestingModule } from "@nestjs/testing";
import { FraudService } from "../fraud.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../common/redis/redis.service";

describe("FraudService", () => {
  let service: FraudService;
  let prisma: any;
  let redis: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
    returnRequest: {
      count: jest.fn(),
    },
    refund: {
      count: jest.fn(),
    },
    referralEvent: {
      count: jest.fn(),
    },
    fraudRiskEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({
      createdAt: new Date("2023-01-01"),
    });
    // order.count is called 5 times: failedPayments30d, orders7d, orders30d, cancellations30d, totalOrders
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.returnRequest.count.mockResolvedValue(0);
    mockPrisma.refund.count.mockResolvedValue(0);
    mockPrisma.referralEvent.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<FraudService>(FraudService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
  });

  describe("evaluateRisk", () => {
    it("should return low risk for clean user", async () => {
      const result = await service.evaluateRisk("user-1", "order", {});

      expect(result.score).toBeLessThan(0.3);
      expect(result.level).toBe("low");
      expect(result.action).toBe("allow");
      expect(result.flags).toEqual([]);
    });

    it("should return high risk for user with many cancellations", async () => {
      // order.count is called 5 times: failedPayments30d, orders7d, orders30d, cancellations30d, totalOrders
      const orderCounts = [5, 15, 15, 15, 15];
      let orderCallIdx = 0;
      mockPrisma.order.count.mockImplementation(async () => orderCounts[orderCallIdx++]);

      const result = await service.evaluateRisk("user-1", "order", {});

      expect(result.score).toBeGreaterThanOrEqual(0.6);
      expect(result.level).toBe("high");
      expect(result.action).toBe("block");
      expect(result.flags).toContain("high_cancellation_rate");
    });

    it("should return medium risk for suspicious user", async () => {
      const orderCounts = [4, 8, 15, 4, 15];
      let orderCallIdx = 0;
      mockPrisma.order.count.mockImplementation(async () => orderCounts[orderCallIdx++]);

      const result = await service.evaluateRisk("user-1", "order", {});

      expect(result.score).toBeGreaterThanOrEqual(0.3);
      expect(result.score).toBeLessThan(0.6);
      expect(result.level).toBe("medium");
      expect(result.action).toBe("review");
    });

    it("should flag high return rate", async () => {
      const orderCounts = [0, 1, 10, 1, 10];
      let orderCallIdx = 0;
      mockPrisma.order.count.mockImplementation(async () => orderCounts[orderCallIdx++]);
      mockPrisma.returnRequest.count.mockResolvedValue(8);

      const result = await service.evaluateRisk("user-1", "order", {});

      expect(result.flags).toContain("high_return_rate");
    });

    it("should flag order velocity", async () => {
      const orderCounts = [0, 15, 20, 0, 20];
      let orderCallIdx = 0;
      mockPrisma.order.count.mockImplementation(async () => orderCounts[orderCallIdx++]);

      const result = await service.evaluateRisk("user-1", "order", {});

      expect(result.flags).toContain("order_velocity");
    });
  });

  describe("createRiskEvent", () => {
    it("should store risk event in database", async () => {
      prisma.fraudRiskEvent.create.mockResolvedValue({});

      await service.createRiskEvent({
        userId: "user-1",
        type: "suspicious_order",
        riskLevel: "high",
        score: 0.8,
        details: { reason: "high cancellation rate" },
        action: "block",
      });

      expect(prisma.fraudRiskEvent.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          sessionId: undefined,
          type: "suspicious_order",
          riskLevel: "high",
          score: 0.8,
          details: { reason: "high cancellation rate" },
          action: "block",
        },
      });
    });

    it("should handle errors gracefully", async () => {
      prisma.fraudRiskEvent.create.mockRejectedValue(new Error("DB Error"));

      await expect(
        service.createRiskEvent({
          type: "test",
          riskLevel: "low",
          score: 0.1,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getUserRiskScore", () => {
    it("should return cached score when available", async () => {
      mockRedis.get.mockResolvedValue("45");

      const score = await service.getUserRiskScore("user-1");
      expect(score).toBe(45);
      expect(prisma.order.count).not.toHaveBeenCalled();
    });

    it("should compute and cache score", async () => {
      mockRedis.get.mockResolvedValue(null);

      const score = await service.getUserRiskScore("user-1");
      expect(typeof score).toBe("number");
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining("fraud:score:user-1"),
        expect.any(String),
        900,
      );
    });

    it("should return low score for new user with no activity", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        createdAt: new Date(),
      });

      const score = await service.getUserRiskScore("user-1");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
