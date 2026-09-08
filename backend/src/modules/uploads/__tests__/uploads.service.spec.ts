jest.mock("uuid", () => ({ v4: () => "test-uuid-123" }));

import { Test, TestingModule } from "@nestjs/testing";
import { UploadsService } from "../uploads.service";
import { ConfigService } from "@nestjs/config";

describe("UploadsService", () => {
  let service: UploadsService;
  let config: any;

  beforeEach(async () => {
    config = {
      get: jest.fn().mockImplementation((key: string) => {
        const values: Record<string, string> = {
          S3_BUCKET: "test-bucket",
          S3_ENDPOINT: "",
          LOCAL_STORAGE_PATH: "/tmp/test-uploads",
          BASE_URL: "http://localhost:4000",
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateFile", () => {
    it("should accept valid image files", () => {
      const file = {
        size: 1024 * 1024, // 1MB
        mimetype: "image/jpeg",
        originalname: "test.jpg",
      } as Express.Multer.File;

      const result = service.validateFile(file, service.getValidation("banner"));
      expect(result.valid).toBe(true);
    });

    it("should reject files exceeding max size", () => {
      const file = {
        size: 10 * 1024 * 1024, // 10MB (exceeds 5MB banner limit)
        mimetype: "image/jpeg",
        originalname: "test.jpg",
      } as Express.Multer.File;

      const result = service.validateFile(file, service.getValidation("banner"));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds limit");
    });

    it("should reject invalid MIME types", () => {
      const file = {
        size: 1024,
        mimetype: "application/pdf",
        originalname: "test.pdf",
      } as Express.Multer.File;

      const result = service.validateFile(file, service.getValidation("banner"));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("MIME type");
    });

    it("should reject invalid extensions", () => {
      const file = {
        size: 1024,
        mimetype: "image/jpeg",
        originalname: "test.gif",
      } as Express.Multer.File;

      const result = service.validateFile(file, service.getValidation("banner"));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Extension");
    });

    it("should accept webp images", () => {
      const file = {
        size: 1024,
        mimetype: "image/webp",
        originalname: "test.webp",
      } as Express.Multer.File;

      const result = service.validateFile(file, service.getValidation("banner"));
      expect(result.valid).toBe(true);
    });

    it("should accept avif images", () => {
      const file = {
        size: 1024,
        mimetype: "image/avif",
        originalname: "test.avif",
      } as Express.Multer.File;

      const result = service.validateFile(file, service.getValidation("banner"));
      expect(result.valid).toBe(true);
    });
  });

  describe("getValidation", () => {
    it("should return banner validation rules", () => {
      const validation = service.getValidation("banner");
      expect(validation.maxSize).toBe(5 * 1024 * 1024);
      expect(validation.allowedMimeTypes).toContain("image/jpeg");
      expect(validation.allowedMimeTypes).toContain("image/png");
      expect(validation.allowedMimeTypes).toContain("image/webp");
    });

    it("should return product validation rules with larger size limit", () => {
      const validation = service.getValidation("product");
      expect(validation.maxSize).toBe(10 * 1024 * 1024);
    });
  });

  describe("isUsingS3", () => {
    it("should return false when S3_ENDPOINT is not set", () => {
      expect(service.isUsingS3).toBe(false);
    });
  });

  describe("getPresignedUrl", () => {
    it("should return placeholder URL when S3 is not configured", async () => {
      const result = await service.getPresignedUrl("test.jpg", "image/jpeg", "banners");
      expect(result.url).toContain("example.com");
      expect(result.url).toContain("banners");
    });
  });

  describe("delete", () => {
    it("should not throw when S3 is not configured", async () => {
      await expect(service.delete("test-key")).resolves.not.toThrow();
    });
  });
});
