import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

const CACHE_KEY = "feature-flags:all";
const CACHE_TTL = 300;

const DEFAULT_FLAGS: Record<string, { envKey: string; default: boolean }> = {
  AI_ASSISTANT: { envKey: "FEATURE_AI_ASSISTANT", default: true },
  VOICE_SEARCH: { envKey: "FEATURE_VOICE_SEARCH", default: true },
  IMAGE_SEARCH: { envKey: "FEATURE_IMAGE_SEARCH", default: true },
  BARCODE_SEARCH: { envKey: "FEATURE_BARCODE_SEARCH", default: true },
  LOYALTY: { envKey: "FEATURE_LOYALTY", default: true },
  MEMBERSHIP: { envKey: "FEATURE_MEMBERSHIP", default: true },
  REFERRALS: { envKey: "FEATURE_REFERRALS", default: true },
};

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  async isEnabled(flagKey: string): Promise<boolean> {
    const flags = await this.getFlags();
    return flags[flagKey] ?? this.getDefault(flagKey);
  }

  async getFlags(): Promise<Record<string, boolean>> {
    const cached = await this.redis.cacheGet<Record<string, boolean>>(CACHE_KEY);
    if (cached) return cached;

    const allKeys = Object.keys(DEFAULT_FLAGS);
    const rows = await this.prisma.systemConfig.findMany({
      where: { key: { in: allKeys.map((k) => `feature:${k}`) } },
    });

    const dbFlags: Record<string, boolean> = {};
    for (const row of rows) {
      const key = row.key.replace("feature:", "");
      dbFlags[key] = Boolean(row.value);
    }

    const result: Record<string, boolean> = {};
    for (const key of allKeys) {
      if (key in dbFlags) {
        result[key] = dbFlags[key];
      } else {
        const envVal = this.config.get<string>(DEFAULT_FLAGS[key].envKey);
        result[key] = envVal !== undefined ? envVal === "true" : DEFAULT_FLAGS[key].default;
      }
    }

    await this.redis.cacheSet(CACHE_KEY, result, CACHE_TTL);
    return result;
  }

  async setFlag(flagKey: string, enabled: boolean): Promise<void> {
    await this.prisma.systemConfig.upsert({
      where: { key: `feature:${flagKey}` },
      update: { value: enabled },
      create: { key: `feature:${flagKey}`, value: enabled, category: "feature-flags" },
    });
    await this.redis.del(CACHE_KEY);
    this.logger.log(`Feature flag ${flagKey} set to ${enabled}`);
  }

  async getFlagConfig(flagKey: string): Promise<{ key: string; enabled: boolean; source: string }> {
    const dbRow = await this.prisma.systemConfig.findUnique({
      where: { key: `feature:${flagKey}` },
    });

    if (dbRow) {
      return { key: flagKey, enabled: Boolean(dbRow.value), source: "database" };
    }

    const def = DEFAULT_FLAGS[flagKey];
    if (!def) return { key: flagKey, enabled: false, source: "unknown" };

    const envVal = this.config.get<string>(def.envKey);
    if (envVal !== undefined) {
      return { key: flagKey, enabled: envVal === "true", source: "environment" };
    }

    return { key: flagKey, enabled: def.default, source: "default" };
  }

  private getDefault(flagKey: string): boolean {
    const def = DEFAULT_FLAGS[flagKey];
    if (!def) return false;
    const envVal = this.config.get<string>(def.envKey);
    return envVal !== undefined ? envVal === "true" : def.default;
  }
}
