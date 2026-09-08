import { Test, TestingModule } from "@nestjs/testing";
import { PincodeLookupService } from "./pincode-lookup.service";
import { RedisService } from "../../common/redis/redis.service";
import { HttpException } from "@nestjs/common";

describe("PincodeLookupService", () => {
  let service: PincodeLookupService;
  let redisService: RedisService;

  const mockRedisService = {
    cacheGet: jest.fn(),
    cacheSet: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Mock global fetch
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PincodeLookupService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<PincodeLookupService>(PincodeLookupService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("isValidPincode", () => {
    it("should validate correct 6-digit Indian pincode formats", () => {
      expect(service.isValidPincode("110001")).toBe(true);
      expect(service.isValidPincode("400001")).toBe(true);
      expect(service.isValidPincode("560001")).toBe(true);
      expect(service.isValidPincode("700001")).toBe(true);
      expect(service.isValidPincode("600001")).toBe(true);
    });

    it("should reject invalid pincode formats", () => {
      expect(service.isValidPincode("123")).toBe(false);
      expect(service.isValidPincode("1234567")).toBe(false);
      expect(service.isValidPincode("012345")).toBe(false);
      expect(service.isValidPincode("abcdef")).toBe(false);
      expect(service.isValidPincode("")).toBe(false);
      expect(service.isValidPincode("12345a")).toBe(false);
    });
  });

  describe("lookup", () => {
    const validPincode = "110001";
    const mockCachedResult = {
      pincode: "110001",
      city: "New Delhi",
      district: "Central Delhi",
      state: "Delhi",
      region: "Delhi",
      postOffices: [
        { name: "GPO", area: "New Delhi", district: "Central Delhi" },
        { name: "Parliament House", area: "New Delhi", district: "Central Delhi" },
      ],
    };

    const mockApiResponse = [
      {
        Status: "Success",
        PostOffice: [
          { Name: "GPO", District: "Central Delhi", Circle: "Delhi", Division: "Delhi", Region: "Delhi" },
          { Name: "Parliament House", District: "Central Delhi", Circle: "Delhi", Division: "Delhi", Region: "Delhi" },
        ],
      },
    ];

    it("should throw for invalid pincode", async () => {
      await expect(service.lookup("123")).rejects.toThrow(HttpException);
      await expect(service.lookup("123")).rejects.toThrow("Invalid PIN code");
    });

    it("should return cached result if available", async () => {
      mockRedisService.cacheGet.mockResolvedValue(mockCachedResult);

      const result = await service.lookup(validPincode);

      expect(result).toEqual(mockCachedResult);
      expect(mockRedisService.cacheGet).toHaveBeenCalledWith(`pincode:${validPincode}`);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should fetch from external API when cache misses", async () => {
      mockRedisService.cacheGet.mockResolvedValue(null);
      mockRedisService.get.mockResolvedValue(null); // no negative cache
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await service.lookup(validPincode);

      expect(result.pincode).toBe(validPincode);
      expect(result.city).toBe("Central Delhi");
      expect(result.state).toBe("Delhi");
      expect(result.postOffices.length).toBe(2);
      expect(mockRedisService.cacheSet).toHaveBeenCalledWith(
        `pincode:${validPincode}`,
        expect.any(Object),
        2592000,
      );
    });

    it("should use negative cache for not-found pincodes", async () => {
      mockRedisService.cacheGet.mockResolvedValue(null);
      mockRedisService.get.mockResolvedValue("1"); // negative cache hit

      await expect(service.lookup("999999")).rejects.toThrow(HttpException);
      await expect(service.lookup("999999")).rejects.toThrow("not found");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle API returning non-success status", async () => {
      mockRedisService.cacheGet.mockResolvedValue(null);
      mockRedisService.get.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [{ Status: "Error", PostOffice: [] }],
      });

      await expect(service.lookup(validPincode)).rejects.toThrow(HttpException);
    });

    it("should handle network/fetch errors", async () => {
      mockRedisService.cacheGet.mockResolvedValue(null);
      mockRedisService.get.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      await expect(service.lookup(validPincode)).rejects.toThrow(HttpException);
    });

    it("should handle fetch timeout", async () => {
      mockRedisService.cacheGet.mockResolvedValue(null);
      mockRedisService.get.mockResolvedValue(null);

      const abortError = new DOMException("The operation was aborted", "AbortError");
      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      await expect(service.lookup(validPincode)).rejects.toThrow(HttpException);
    });

    it("should handle HTTP error responses from external API", async () => {
      mockRedisService.cacheGet.mockResolvedValue(null);
      mockRedisService.get.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.lookup(validPincode)).rejects.toThrow(HttpException);
    });
  });
});
