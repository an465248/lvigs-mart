import { Test, TestingModule } from "@nestjs/testing";
import { SearchService } from "./search.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache/cache.service";
import { OpenSearchService } from "../../common/opensearch/opensearch.service";

describe("SearchService", () => {
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
    mockCache.getOrSet.mockImplementation(async (_key: string, compute: () => Promise<any>) => {
      return compute();
    });

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

  describe("search", () => {
    it("should return empty for empty query", async () => {
      const result = await service.search("");
      expect(result).toEqual([]);
    });

    it("should query products with correct filters", async () => {
      prisma.product.findMany.mockResolvedValue([]);
      await service.search("phone", 10);
      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it("should return cached results when available", async () => {
      const cachedResults = [{ id: "1", title: "Cached Phone" }];
      cache.get.mockResolvedValue(cachedResults);

      const result = await service.search("phone");
      expect(result).toEqual(cachedResults);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it("should use OpenSearch when enabled", async () => {
      opensearch.isEnabled = true;
      opensearch.search.mockResolvedValue([{ id: "1", title: "OS Phone", score: 1.5 }]);

      const result = await service.search("phone");
      expect(opensearch.search).toHaveBeenCalledWith("phone", { limit: 10 });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("OS Phone");
    });

    it("should fallback to PostgreSQL when OpenSearch returns empty", async () => {
      opensearch.isEnabled = true;
      opensearch.search.mockResolvedValue([]);
      prisma.product.findMany.mockResolvedValue([{ id: "2", title: "PG Phone" }]);

      const result = await service.search("phone");
      expect(opensearch.search).toHaveBeenCalled();
      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("PG Phone");
    });

    it("should fallback to PostgreSQL when OpenSearch fails", async () => {
      opensearch.isEnabled = true;
      opensearch.search.mockRejectedValue(new Error("Connection refused"));
      prisma.product.findMany.mockResolvedValue([{ id: "3", title: "Fallback Phone" }]);

      const result = await service.search("phone");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Fallback Phone");
    });

    it("should handle errors gracefully", async () => {
      prisma.product.findMany.mockRejectedValue(new Error("DB Error"));
      const result = await service.search("phone");
      expect(result).toEqual([]);
    });
  });

  describe("suggestions", () => {
    it("should run queries in parallel", async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.category.findMany.mockResolvedValue([]);
      prisma.brand.findMany.mockResolvedValue([]);

      const result = await service.suggestions("phone");
      expect(result).toHaveProperty("products");
      expect(result).toHaveProperty("categories");
      expect(result).toHaveProperty("brands");
    });

    it("should return empty for empty query", async () => {
      const result = await service.suggestions("");
      expect(result).toEqual({ products: [], categories: [], brands: [] });
    });

    it("should return cached suggestions", async () => {
      const cachedSuggestions = {
        products: [{ id: "1", title: "Phone" }],
        categories: [{ id: "1", name: "Electronics" }],
        brands: [{ id: "1", name: "Samsung" }],
      };
      cache.get.mockResolvedValue(cachedSuggestions);

      const result = await service.suggestions("phone");
      expect(result).toEqual(cachedSuggestions);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });
  });

  describe("trending", () => {
    it("should return default trending searches", async () => {
      const result = await service.trending();
      expect(result).toContain("iPhone 15");
      expect(result).toContain("Wireless earbuds");
    });

    it("should return cached trending", async () => {
      const cachedTrending = ["Cached1", "Cached2"];
      cache.get.mockResolvedValue(cachedTrending);

      const result = await service.trending();
      expect(result).toEqual(cachedTrending);
    });
  });

  describe("recent", () => {
    it("should return recent search queries for a user", async () => {
      prisma.userEvent.findMany.mockResolvedValue([
        { metadata: { query: "phone" } },
        { metadata: { query: "laptop" } },
      ]);

      const result = await service.recent("user-1");
      expect(result).toEqual(["phone", "laptop"]);
    });

    it("should handle errors gracefully", async () => {
      prisma.userEvent.findMany.mockRejectedValue(new Error("DB Error"));
      const result = await service.recent("user-1");
      expect(result).toEqual([]);
    });
  });

  describe("indexProduct", () => {
    it("should index product when OpenSearch is enabled", async () => {
      opensearch.isEnabled = true;
      const product = { id: "1", title: "Phone" };

      await service.indexProduct(product);
      expect(opensearch.indexProduct).toHaveBeenCalledWith(product);
    });

    it("should not index when OpenSearch is disabled", async () => {
      opensearch.isEnabled = false;
      await service.indexProduct({ id: "1" });
      expect(opensearch.indexProduct).not.toHaveBeenCalled();
    });
  });

  describe("removeProduct", () => {
    it("should remove product when OpenSearch is enabled", async () => {
      opensearch.isEnabled = true;
      await service.removeProduct("product-1");
      expect(opensearch.removeProduct).toHaveBeenCalledWith("product-1");
    });

    it("should not remove when OpenSearch is disabled", async () => {
      opensearch.isEnabled = false;
      await service.removeProduct("product-1");
      expect(opensearch.removeProduct).not.toHaveBeenCalled();
    });
  });

  describe("searchEngine", () => {
    it("should return postgresql when OpenSearch is disabled", () => {
      opensearch.isEnabled = false;
      expect(service.searchEngine).toBe("postgresql");
    });

    it("should return opensearch when enabled", () => {
      opensearch.isEnabled = true;
      expect(service.searchEngine).toBe("opensearch");
    });
  });
});
