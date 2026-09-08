import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsService } from "../analytics.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../common/redis/redis.service";
import { AnalyticsEventType } from "../dto/analytics.dto";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let prisma: any;
  let redis: any;

  const mockPrisma = {
    userEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockRedis = {
    exists: jest.fn(),
    set: jest.fn(),
    cacheGet: jest.fn(),
    cacheSet: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.exists.mockResolvedValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
  });

  describe("trackEvent", () => {
    it("should store event in database", async () => {
      mockRedis.exists.mockResolvedValue(false);
      prisma.userEvent.create.mockResolvedValue({});

      await service.trackEvent({
        userId: "user-1",
        type: AnalyticsEventType.PRODUCT_VIEW,
        productId: "prod-1",
      });

      expect(prisma.userEvent.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          sessionId: undefined,
          type: AnalyticsEventType.PRODUCT_VIEW,
          productId: "prod-1",
          metadata: undefined,
        },
      });
    });

    it("should not store duplicate event within dedup window", async () => {
      mockRedis.exists.mockResolvedValue(true);

      await service.trackEvent({
        userId: "user-1",
        type: AnalyticsEventType.PRODUCT_VIEW,
        productId: "prod-1",
      });

      expect(prisma.userEvent.create).not.toHaveBeenCalled();
    });

    it("should set dedup key in cache", async () => {
      mockRedis.exists.mockResolvedValue(false);
      prisma.userEvent.create.mockResolvedValue({});

      await service.trackEvent({
        userId: "user-1",
        type: AnalyticsEventType.ADD_TO_CART,
      });

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining("dedup:"),
        "1",
        900,
      );
    });

    it("should handle errors gracefully", async () => {
      mockRedis.exists.mockResolvedValue(false);
      prisma.userEvent.create.mockRejectedValue(new Error("DB Error"));

      await expect(
        service.trackEvent({
          userId: "user-1",
          type: AnalyticsEventType.SEARCH,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getAggregateMetrics", () => {
    it("should return cached metrics when available", async () => {
      const cachedMetrics = {
        period: { from: new Date("2024-01-01"), to: new Date("2024-01-31") },
        totalEvents: 100,
        byType: { search: 50, product_view: 50 },
        uniqueUsers: 10,
        topProducts: [],
      };
      mockRedis.cacheGet.mockResolvedValue(cachedMetrics);

      const result = await service.getAggregateMetrics(
        new Date("2024-01-01"),
        new Date("2024-01-31"),
      );
      expect(result).toEqual(cachedMetrics);
      expect(prisma.userEvent.findMany).not.toHaveBeenCalled();
    });

    it("should compute metrics from database", async () => {
      mockRedis.cacheGet.mockResolvedValue(null);
      prisma.userEvent.findMany.mockResolvedValue([
        { type: "search", userId: "user-1", productId: "prod-1" },
        { type: "search", userId: "user-2", productId: "prod-1" },
        { type: "product_view", userId: "user-1", productId: "prod-2" },
      ]);

      const result = await service.getAggregateMetrics(
        new Date("2024-01-01"),
        new Date("2024-01-31"),
      );

      expect(result.totalEvents).toBe(3);
      expect(result.byType).toEqual({ search: 2, product_view: 1 });
      expect(result.uniqueUsers).toBe(2);
      expect(result.topProducts[0].productId).toBe("prod-1");
      expect(result.topProducts[0].count).toBe(2);
    });

    it("should cache computed metrics", async () => {
      mockRedis.cacheGet.mockResolvedValue(null);
      prisma.userEvent.findMany.mockResolvedValue([]);

      await service.getAggregateMetrics(
        new Date("2024-01-01"),
        new Date("2024-01-31"),
      );

      expect(redis.cacheSet).toHaveBeenCalled();
    });

    it("should return zero metrics for empty period", async () => {
      mockRedis.cacheGet.mockResolvedValue(null);
      prisma.userEvent.findMany.mockResolvedValue([]);

      const result = await service.getAggregateMetrics(
        new Date("2024-01-01"),
        new Date("2024-01-31"),
      );

      expect(result.totalEvents).toBe(0);
      expect(result.uniqueUsers).toBe(0);
      expect(result.topProducts).toEqual([]);
    });
  });
});
