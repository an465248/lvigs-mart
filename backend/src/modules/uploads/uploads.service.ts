import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";

export interface UploadValidation {
  maxSize: number; // bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export interface UploadResult {
  url: string;
  key?: string;
  filename: string;
  size: number;
  mimetype: string;
}

const BANNER_VALIDATION: UploadValidation = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
};

const PRODUCT_VALIDATION: UploadValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private s3: S3Client | null = null;
  private bucket: string;
  private localStoragePath: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get("S3_BUCKET") || "lvigs-mart";
    this.localStoragePath = this.config.get("LOCAL_STORAGE_PATH") || path.join(process.cwd(), "uploads");

    const endpoint = this.config.get("S3_ENDPOINT");
    if (endpoint) {
      this.s3 = new S3Client({
        region: this.config.get("S3_REGION") || "ap-south-1",
        endpoint,
        credentials: {
          accessKeyId: this.config.get("S3_ACCESS_KEY") || "",
          secretAccessKey: this.config.get("S3_SECRET_KEY") || "",
        },
      });
    } else {
      this.ensureLocalStorageDir();
    }
  }

  private async ensureLocalStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.localStoragePath, { recursive: true });
      await fs.mkdir(path.join(this.localStoragePath, "banners"), { recursive: true });
      await fs.mkdir(path.join(this.localStoragePath, "products"), { recursive: true });
    } catch (err: any) {
      this.logger.warn(`Failed to create local storage directories: ${err.message}`);
    }
  }

  validateFile(
    file: Express.Multer.File,
    validation: UploadValidation
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > validation.maxSize) {
      return {
        valid: false,
        error: `File size ${this.formatBytes(file.size)} exceeds limit of ${this.formatBytes(validation.maxSize)}`,
      };
    }

    // Check MIME type
    if (!validation.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `MIME type "${file.mimetype}" not allowed. Allowed: ${validation.allowedMimeTypes.join(", ")}`,
      };
    }

    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!validation.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Extension "${ext}" not allowed. Allowed: ${validation.allowedExtensions.join(", ")}`,
      };
    }

    return { valid: true };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  async uploadBannerImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, "banners", BANNER_VALIDATION);
  }

  async uploadProductImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, "products", PRODUCT_VALIDATION);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    validation: UploadValidation
  ): Promise<UploadResult> {
    const validationError = this.validateFile(file, validation);
    if (!validationError.valid) {
      throw new Error(validationError.error);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuid()}${ext}`;
    const key = `${folder}/${filename}`;

    if (this.s3) {
      return this.uploadToS3(file, key, filename);
    } else {
      return this.uploadToLocal(file, key, filename, folder);
    }
  }

  private async uploadToS3(
    file: Express.Multer.File,
    key: string,
    filename: string
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    });

    await this.s3!.send(command);

    const endpoint = this.config.get("S3_ENDPOINT");
    const url = `${endpoint}/${this.bucket}/${key}`;

    return {
      url,
      key,
      filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    key: string,
    filename: string,
    folder: string
  ): Promise<UploadResult> {
    const dir = path.join(this.localStoragePath, folder);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, file.buffer);

    const baseUrl = this.config.get("BASE_URL") || "http://localhost:4000";
    const url = `${baseUrl}/uploads/${key}`;

    return {
      url,
      key,
      filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async getPresignedUrl(filename: string, contentType: string, folder = "uploads") {
    if (!this.s3) {
      return { url: `https://example.com/${folder}/${uuid()}-${filename}`, fields: {} };
    }
    const key = `${folder}/${uuid()}-${filename}`;
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { url, fields: { key, bucket: this.bucket } };
  }

  async delete(key: string) {
    if (this.s3) {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } else {
      try {
        const filePath = path.join(this.localStoragePath, key);
        await fs.unlink(filePath);
      } catch {
        // File may not exist
      }
    }
  }

  getValidation(type: "banner" | "product"): UploadValidation {
    return type === "banner" ? BANNER_VALIDATION : PRODUCT_VALIDATION;
  }

  get isUsingS3(): boolean {
    return this.s3 !== null;
  }
}
