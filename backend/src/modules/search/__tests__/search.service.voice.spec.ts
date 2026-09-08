import { Test, TestingModule } from "@nestjs/testing";
import { SearchService } from "../search.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { CacheService } from "../../../common/cache/cache.service";
import { OpenSearchService } from "../../../common/opensearch/opensearch.service";

describe("SearchService - Voice Search", () => {
  let service: SearchService;
  let prisma: any;
  let cache: any;
  let opensearch: any;

  const mockPrisma = {
    product: { findMany: jest.fn() },
    category: { findMany: jest.fn() },
    brand: { findMany: jest.fn() },
    userEvent: { findMany: jest.fn() },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    getOrSet: jest.fn(),
    del: jest.fn(),
  };

  const mockOpenSearch = {
    isEnabled: false,
    search: jest.fn(),
    indexProduct: jest.fn(),
    removeProduct: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOpenSearch.isEnabled = false;
    mockCache.get.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
        { provide: OpenSearchService, useValue: mockOpenSearch },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get(PrismaService);
    cache = module.get(CacheService);
    opensearch = module.get(OpenSearchService);
  });

  describe("voiceSearch", () => {
    it("should return products for valid transcript", async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: "1", title: "iPhone 15", price: 79999 },
      ]);

      const result = await service.voiceSearch(
        "show me iPhones under 80000",
        "en",
      );

      expect(result.found).toBe(true);
      expect(result.query).toBe("show me iPhones under 80000");
      expect(result.products).toHaveLength(1);
      expect(result.language).toBe("en");
      expect(result.parsedIntent).toBeDefined();
    });

    it("should return empty for empty transcript", async () => {
      const result = await service.voiceSearch("", "en");

      expect(result.found).toBe(false);
      expect(result.products).toEqual([]);
      expect(result.message).toBe("Empty transcript");
    });

    it("should return empty for whitespace-only transcript", async () => {
      const result = await service.voiceSearch("   ", "en");

      expect(result.found).toBe(false);
      expect(result.message).toBe("Empty transcript");
    });

    it("should search with parsed keywords", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.voiceSearch("dikhao wireless headphones", "hi");

      expect(prisma.product.findMany).toHaveBeenCalled();
      const callArgs = prisma.product.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
    });
  });

  describe("parseVoiceIntent", () => {
    it("should extract budget from Hindi transcript", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "phone 10000 ke andar dikhao",
        "hi",
      );

      expect(result.parsedIntent!.budget).toBe(10000);
    });

    it("should extract budget from English transcript", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "laptop under 50000",
        "en",
      );

      expect(result.parsedIntent!.budget).toBe(50000);
    });

    it("should extract budget with rupee symbol", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "show me ₹25000 phones",
        "en",
      );

      expect(result.parsedIntent!.budget).toBe(25000);
    });

    it("should extract category - phone", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "show me phones",
        "en",
      );

      expect(result.parsedIntent!.category).toBe("phone");
      expect(result.parsedIntent!.keywords).toContain("phone");
    });

    it("should extract category - laptop", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "mujhe laptop chahiye",
        "hi",
      );

      expect(result.parsedIntent!.category).toBe("laptop");
      expect(result.parsedIntent!.keywords).toContain("laptop");
    });

    it("should extract category - headphone", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "earbuds dikhao",
        "hi",
      );

      expect(result.parsedIntent!.category).toBe("headphone");
      expect(result.parsedIntent!.keywords).toContain("earbuds");
    });

    it("should extract category - shoes", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "running shoes under 3000",
        "en",
      );

      expect(result.parsedIntent!.category).toBe("shoes");
      expect(result.parsedIntent!.keywords).toContain("shoes");
    });

    it("should extract brand - Samsung", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "Samsung phones under 20000",
        "en",
      );

      expect(result.parsedIntent!.brand).toBe("Samsung");
      expect(result.parsedIntent!.keywords).toContain("Samsung");
    });

    it("should extract brand - Apple", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "show me Apple phones",
        "en",
      );

      expect(result.parsedIntent!.brand).toBe("Apple");
      expect(result.parsedIntent!.keywords).toContain("Apple");
    });

    it("should extract brand - Nike", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "Nike shoes under 5000",
        "en",
      );

      expect(result.parsedIntent!.brand).toBe("Nike");
    });

    it("should extract multiple intents", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "Samsung phone 15000 ke andar",
        "hi",
      );

      expect(result.parsedIntent!.brand).toBe("Samsung");
      expect(result.parsedIntent!.category).toBe("phone");
      expect(result.parsedIntent!.budget).toBe(15000);
    });

    it("should handle transcript with no budget", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "show me trending products",
        "en",
      );

      expect(result.parsedIntent!.budget).toBeUndefined();
    });

    it("should handle transcript with no category", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.voiceSearch(
        "best products under 5000",
        "en",
      );

      expect(result.parsedIntent!.category).toBeUndefined();
    });
  });
});
