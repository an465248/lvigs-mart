import { Test, TestingModule } from "@nestjs/testing";
import { FeatureFlagsService } from "../feature-flags.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../common/redis/redis.service";
import { ConfigService } from "@nestjs/config";

describe("FeatureFlagsService", () => {
  let service: FeatureFlagsService;
  let prisma: any;
  let redis: any;
  let config: any;

  const mockPrisma = {
    systemConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockRedis = {
    cacheGet: jest.fn(),
    cacheSet: jest.fn(),
    del: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.cacheGet.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    config = module.get(ConfigService);
  });

  describe("isEnabled", () => {
    it("should return true when flag is set in database", async () => {
      mockRedis.cacheGet.mockResolvedValue(null);
      prisma.systemConfig.findMany.mockResolvedValue([
        { key: "feature:AI_ASSISTANT", value: true },
      ]);

      const result = await service.isEnabled("AI_ASSISTANT");
      expect(result).toBe(true);
    });

    it("should return env var fallback when flag not in database", async () => {
      mockRedis.cacheGet.mockResolvedValue(null);
      prisma.systemConfig.findMany.mockResolvedValue([]);
      config.get.mockImplementation((key: string) => {
        if (key === "FEATURE_AI_ASSISTANT") return "false";
        return undefined;
      });

      const result = await service.isEnabled("AI_ASSISTANT");
      expect(result).toBe(false);
    });

    it("should return default value when no env var and no database entry", async () => {
      mockRedis.cacheGet.mockResolvedValue(null);
      prisma.systemConfig.findMany.mockResolvedValue([]);
      config.get.mockReturnValue(undefined);

      const result = await service.isEnabled("AI_ASSISTANT");
      expect(result).toBe(true);
    });

    it("should return false for unknown flag key", async () => {
      mockRedis.cacheGet.mockResolvedValue(null);
      prisma.systemConfig.findMany.mockResolvedValue([]);
      config.get.mockReturnValue(undefined);

      const result = await service.isEnabled("UNKNOWN_FLAG");
      expect(result).toBe(false);
    });

    it("should use cached flags when available", async () => {
      const cachedFlags = { AI_ASSISTANT: true, VOICE_SEARCH: false };
      mockRedis.cacheGet.mockResolvedValue(cachedFlags);

      const result = await service.isEnabled("AI_ASSISTANT");
      expect(result).toBe(true);
      expect(prisma.systemConfig.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getFlags", () => {
    it("should return all flags from cache when available", async () => {
      const cachedFlags = {
        AI_ASSISTANT: true,
        VOICE_SEARCH: false,
        IMAGE_SEARCH: true,
        BARCODE_SEARCH: true,
        LOYALTY: true,
        MEMBERSHIP: true,
        REFERRALS: true,
      };
      mockRedis.cacheGet.mockResolvedValue(cachedFlags);

      const result = await service.getFlags();
      expect(result).toEqual(cachedFlags);
      expect(prisma.systemConfig.findMany).not.toHaveBeenCalled();
    });

    it("should query database and cache results", async () => {
      mockRedis.cacheGet.mockResolvedValue(null);
      prisma.systemConfig.findMany.mockResolvedValue([
        { key: "feature:AI_ASSISTANT", value: false },
        { key: "feature:VOICE_SEARCH", value: true },
      ]);
      config.get.mockReturnValue(undefined);

      const result = await service.getFlags();
      expect(result.AI_ASSISTANT).toBe(false);
      expect(result.VOICE_SEARCH).toBe(true);
      expect(redis.cacheSet).toHaveBeenCalled();
    });

    it("should use env vars for flags not in database", async () => {
      mockRedis.cacheGet.mockResolvedValue(null);
      prisma.systemConfig.findMany.mockResolvedValue([]);
      config.get.mockImplementation((key: string) => {
        if (key === "FEATURE_AI_ASSISTANT") return "true";
        if (key === "FEATURE_VOICE_SEARCH") return "false";
        return undefined;
      });

      const result = await service.getFlags();
      expect(result.AI_ASSISTANT).toBe(true);
      expect(result.VOICE_SEARCH).toBe(false);
    });
  });

  describe("setFlag", () => {
    it("should upsert flag in database", async () => {
      prisma.systemConfig.upsert.mockResolvedValue({});

      await service.setFlag("AI_ASSISTANT", false);
      expect(prisma.systemConfig.upsert).toHaveBeenCalledWith({
        where: { key: "feature:AI_ASSISTANT" },
        update: { value: false },
        create: { key: "feature:AI_ASSISTANT", value: false, category: "feature-flags" },
      });
    });

    it("should invalidate cache after setting flag", async () => {
      prisma.systemConfig.upsert.mockResolvedValue({});

      await service.setFlag("AI_ASSISTANT", true);
      expect(redis.del).toHaveBeenCalledWith("feature-flags:all");
    });
  });
});
