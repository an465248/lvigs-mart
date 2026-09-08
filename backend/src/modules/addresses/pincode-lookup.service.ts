import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { RedisService } from "../../common/redis/redis.service";

export interface PostOffice {
  name: string;
  branchType: string;
  deliveryStatus: string;
  district: string;
  division: string;
  region: string;
  circle: string;
  pincode: string;
  officeName: string;
}

export interface PincodeLookupResult {
  pincode: string;
  city: string;
  district: string;
  state: string;
  region: string;
  postOffices: { name: string; area: string; district: string }[];
}

interface ExternalApiPostOffice {
  Name: string;
  BranchType: string;
  DeliveryStatus: string;
  District: string;
  Division: string;
  Region: string;
  Circle: string;
  Pincode: string;
  OfficeName: string;
}

@Injectable()
export class PincodeLookupService {
  private readonly logger = new Logger(PincodeLookupService.name);
  private readonly CACHE_PREFIX = "pincode:";
  private readonly CACHE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
  private readonly NEGATIVE_CACHE_TTL = 60 * 60; // 1 hour for not-found
  private readonly API_URL = "https://api.postalpincode.in/pincode";
  private readonly TIMEOUT_MS = 5000;

  constructor(private redis: RedisService) {}

  /**
   * Validate Indian PIN code format: exactly 6 digits, numeric only.
   */
  isValidPincode(pincode: string): boolean {
    return /^[1-9][0-9]{5}$/.test(pincode);
  }

  /**
   * Lookup pincode with Redis caching.
   * Returns normalized location data or throws on failure.
   */
  async lookup(pincode: string): Promise<PincodeLookupResult> {
    // Server-side validation
    if (!this.isValidPincode(pincode)) {
      throw new HttpException(
        { message: "Invalid PIN code. Must be exactly 6 digits starting with 1-9.", code: "INVALID_PINCODE" },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check Redis cache first
    const cacheKey = `${this.CACHE_PREFIX}${pincode}`;
    try {
      const cached = await this.redis.cacheGet<PincodeLookupResult>(cacheKey);
      if (cached !== null) {
        this.logger.debug(`Cache hit for pincode ${pincode}`);
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Redis cache read failed for ${pincode}: ${err}`);
    }

    // Check negative cache (previously not found)
    const negCacheKey = `${this.CACHE_PREFIX}${pincode}:notfound`;
    try {
      const negCached = await this.redis.get(negCacheKey);
      if (negCached === "1") {
        throw new HttpException(
          { message: `PIN code ${pincode} not found. Please check and try again.`, code: "PINCODE_NOT_FOUND" },
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      // Redis failure - proceed to API call
    }

    // Call external API
    const result = await this.fetchFromApi(pincode);

    // Cache the result
    try {
      if (result) {
        await this.redis.cacheSet(cacheKey, result, this.CACHE_TTL);
      } else {
        await this.redis.set(negCacheKey, "1", this.NEGATIVE_CACHE_TTL);
        throw new HttpException(
          { message: `PIN code ${pincode} not found. Please check and try again.`, code: "PINCODE_NOT_FOUND" },
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.warn(`Redis cache write failed for ${pincode}: ${err}`);
    }

    return result!;
  }

  /**
   * Fetch pincode data from external API with timeout and error handling.
   */
  private async fetchFromApi(pincode: string): Promise<PincodeLookupResult | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(`${this.API_URL}/${pincode}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.warn(`External API returned ${response.status} for pincode ${pincode}`);
        return null;
      }

      const body = await response.json();

      // External API returns an array with one element
      if (!Array.isArray(body) || body.length === 0) {
        this.logger.warn(`Unexpected API response format for pincode ${pincode}`);
        return null;
      }

      const data = body[0];

      if (data.Status !== "Success" || !data.PostOffice || !Array.isArray(data.PostOffice) || data.PostOffice.length === 0) {
        this.logger.debug(`No post offices found for pincode ${pincode}`);
        return null;
      }

      return this.normalizeResult(pincode, data.PostOffice);
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        this.logger.error(`External API timeout for pincode ${pincode}`);
        throw new HttpException(
          { message: "Location service timed out. Please try again.", code: "API_TIMEOUT" },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      this.logger.error(`External API error for pincode ${pincode}: ${err.message}`);
      throw new HttpException(
        { message: "Location service temporarily unavailable. Please try again.", code: "API_ERROR" },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Normalize external API response into a clean structure.
   * The primary city is the district of the first post office.
   */
  private normalizeResult(pincode: string, postOffices: ExternalApiPostOffice[]): PincodeLookupResult {
    const first = postOffices[0];

    const postOfficeList = postOffices.map((po) => ({
      name: po.Name || po.OfficeName,
      area: po.Division || po.Region || "",
      district: po.District || "",
    }));

    return {
      pincode,
      city: first.District || first.Division || "",
      district: first.District || "",
      state: first.Circle || first.Region || "",
      region: first.Division || "",
      postOffices: postOfficeList,
    };
  }
}
