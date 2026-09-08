import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

const CACHE_TTL = 3600;
const CACHE_PREFIX = "i18n:";
const FALLBACK_LANG = "en";

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getTranslations(lang: string): Promise<Record<string, string>> {
    const cacheKey = CACHE_PREFIX + lang;
    const cached = await this.redis.cacheGet<Record<string, string>>(cacheKey);
    if (cached) return cached;

    const record = await this.prisma.systemConfig.findUnique({
      where: { key: cacheKey },
    });

    if (record) {
      const translations = record.value as Record<string, string>;
      await this.redis.cacheSet(cacheKey, translations, CACHE_TTL);
      return translations;
    }

    if (lang !== FALLBACK_LANG) {
      return this.getTranslations(FALLBACK_LANG);
    }

    return {};
  }

  async getTranslation(key: string, lang: string): Promise<string> {
    const translations = await this.getTranslations(lang);
    if (translations[key]) return translations[key];

    if (lang !== FALLBACK_LANG) {
      const fallback = await this.getTranslations(FALLBACK_LANG);
      if (fallback[key]) return fallback[key];
    }

    return key;
  }

  async setTranslations(
    lang: string,
    translations: Record<string, string>,
  ): Promise<void> {
    const configKey = CACHE_PREFIX + lang;

    await this.prisma.systemConfig.upsert({
      where: { key: configKey },
      update: { value: translations },
      create: { key: configKey, value: translations, category: "i18n" },
    });

    await this.redis.del(CACHE_PREFIX + lang);
    await this.redis.cacheSet(configKey, translations, CACHE_TTL);

    this.logger.log(`Translations updated for language: ${lang}`);
  }
}
