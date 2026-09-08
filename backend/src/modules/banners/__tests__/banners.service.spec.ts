import { Test, TestingModule } from "@nestjs/testing";
import { BannersService } from "../banners.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { CacheService } from "../../../common/cache/cache.service";

describe("BannersService", () => {
  let service: BannersService;
  let prisma: any;
  let cache: any;

  beforeEach(async () => {
    prisma = {
      banner: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    cache = {
      getOrSet: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getActiveBanners", () => {
    it("should return active banners with date filtering", async () => {
      const now = new Date();
      const banners = [
        {
          id: "1",
          title: "Active Banner",
          isActive: true,
          startsAt: new Date(now.getTime() - 86400000),
          sortOrder: 1,
        },
        {
          id: "2",
          title: "Future Banner",
          isActive: true,
          startsAt: new Date(now.getTime() + 86400000),
          sortOrder: 2,
        },
      ];

      cache.getOrSet.mockResolvedValue(banners);

      const result = await service.getActiveBanners();

      expect(cache.getOrSet).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should filter out future banners", async () => {
      const now = new Date();
      const banners = [
        {
          id: "1",
          title: "Active Banner",
          isActive: true,
          startAt: new Date(now.getTime() - 86400000),
          sortOrder: 1,
        },
        {
          id: "2",
          title: "Future Banner",
          isActive: true,
          startAt: new Date(now.getTime() + 86400000),
          sortOrder: 2,
        },
      ];

      cache.getOrSet.mockImplementation(async (key: string, compute: () => Promise<any>) => {
        return compute();
      });

      prisma.banner.findMany.mockResolvedValue(banners);

      const result = await service.getActiveBanners();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Active Banner");
    });

    it("should return empty array when no active banners", async () => {
      cache.getOrSet.mockImplementation(async (key: string, compute: () => Promise<any>) => {
        return compute();
      });
      prisma.banner.findMany.mockResolvedValue([]);

      const result = await service.getActiveBanners();
      expect(result).toEqual([]);
    });
  });

  describe("createBanner", () => {
    it("should create a banner with all fields", async () => {
      const dto = {
        title: "Test Banner",
        subtitle: "Subtitle",
        image: "https://example.com/image.jpg",
        mobileImage: "https://example.com/mobile.jpg",
        ctaText: "Shop Now",
        ctaUrl: "/category/electronics",
        type: "HOME",
        sortOrder: 1,
        isActive: true,
      };

      const created = { id: "1", ...dto };
      prisma.banner.create.mockResolvedValue(created);

      const result = await service.createBanner(dto);

      expect(prisma.banner.create).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalled();
      expect(result.title).toBe("Test Banner");
    });

    it("should create a banner with minimal fields", async () => {
      const dto = { title: "Minimal Banner", image: "https://example.com/min.jpg" };
      const created = { id: "2", ...dto };
      prisma.banner.create.mockResolvedValue(created);

      const result = await service.createBanner(dto);
      expect(result.id).toBe("2");
    });

    it("should create banner with additional fields", async () => {
      const dto = {
        title: "CTA Banner",
        image: "https://example.com/1.jpg",
        ctaText: "Shop Now",
        ctaUrl: "/category",
      };
      prisma.banner.create.mockResolvedValue({ id: "3", ...dto });

      const result = await service.createBanner(dto);
      expect(result.ctaText).toBe("Shop Now");
    });
  });

  describe("updateBanner", () => {
    it("should update a banner", async () => {
      const existing = { id: "1", title: "Old Title" };
      prisma.banner.findUnique.mockResolvedValue(existing);

      const updated = { id: "1", title: "New Title" };
      prisma.banner.update.mockResolvedValue(updated);

      const result = await service.updateBanner("1", { title: "New Title" });

      expect(prisma.banner.update).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalled();
      expect(result.title).toBe("New Title");
    });

    it("should throw NotFoundException for non-existent banner", async () => {
      prisma.banner.findUnique.mockResolvedValue(null);

      await expect(
        service.updateBanner("nonexistent", { title: "Test" })
      ).rejects.toThrow("Banner not found");
    });

    it("should update only provided fields", async () => {
      const existing = { id: "1", title: "Old", subtitle: "Old Sub" };
      prisma.banner.findUnique.mockResolvedValue(existing);
      prisma.banner.update.mockResolvedValue({ ...existing, title: "New" });

      const result = await service.updateBanner("1", { title: "New" });
      expect(result.title).toBe("New");
    });
  });

  describe("deleteBanner", () => {
    it("should delete a banner", async () => {
      const existing = { id: "1", title: "Test" };
      prisma.banner.findUnique.mockResolvedValue(existing);
      prisma.banner.delete.mockResolvedValue(existing);

      const result = await service.deleteBanner("1");

      expect(prisma.banner.delete).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalled();
      expect(result.id).toBe("1");
    });

    it("should throw NotFoundException for non-existent banner", async () => {
      prisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.deleteBanner("nonexistent")).rejects.toThrow("Banner not found");
    });
  });

  describe("toggleBannerActive", () => {
    it("should toggle banner active status", async () => {
      const existing = { id: "1", isActive: true };
      prisma.banner.findUnique.mockResolvedValue(existing);
      prisma.banner.update.mockResolvedValue({ ...existing, isActive: false });

      const result = await service.toggleBannerActive("1");

      expect(prisma.banner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        })
      );
      expect(result.isActive).toBe(false);
    });

    it("should toggle from inactive to active", async () => {
      const existing = { id: "1", isActive: false };
      prisma.banner.findUnique.mockResolvedValue(existing);
      prisma.banner.update.mockResolvedValue({ ...existing, isActive: true });

      const result = await service.toggleBannerActive("1");
      expect(result.isActive).toBe(true);
    });

    it("should throw NotFoundException for non-existent banner", async () => {
      prisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.toggleBannerActive("nonexistent")).rejects.toThrow("Banner not found");
    });
  });

  describe("reorderBanners", () => {
    it("should reorder banners", async () => {
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.reorderBanners(["3", "1", "2"]);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should handle empty array", async () => {
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.reorderBanners([]);
      expect(result.success).toBe(true);
    });
  });

  describe("getBannerById", () => {
    it("should return a banner by id", async () => {
      const banner = { id: "1", title: "Test Banner" };
      prisma.banner.findUnique.mockResolvedValue(banner);

      const result = await service.getBannerById("1");
      expect(result.id).toBe("1");
    });

    it("should throw NotFoundException for non-existent banner", async () => {
      prisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.getBannerById("nonexistent")).rejects.toThrow("Banner not found");
    });
  });

  describe("getAllBanners", () => {
    it("should return paginated banners", async () => {
      prisma.banner.findMany.mockResolvedValue([
        { id: "1", title: "Banner 1" },
        { id: "2", title: "Banner 2" },
      ]);
      prisma.banner.count.mockResolvedValue(2);

      const result = await service.getAllBanners(1, 10);
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("pagination");
    });
  });

  describe("invalidate", () => {
    it("should invalidate all banner caches", async () => {
      await service.invalidate();

      expect(cache.del).toHaveBeenCalledWith("banners:active");
      expect(cache.delPattern).toHaveBeenCalledWith("banners:active:*");
    });
  });
});
