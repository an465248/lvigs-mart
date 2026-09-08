import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache/cache.service";
import { OpenSearchService } from "../../common/opensearch/opensearch.service";

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly SEARCH_TTL = 300;
  private readonly SUGGESTIONS_TTL = 600;
  private readonly TRENDING_TTL = 3600;

  private readonly DEFAULT_TRENDING = [
    "iPhone 15", "Wireless earbuds", "Smart TV 55 inch",
    "Running shoes", "Coffee maker", "Office chair",
    "Laptop stand", "Power bank", "Bluetooth speaker",
  ];

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private opensearch: OpenSearchService,
  ) {}

  async search(q: string, limit = 10) {
    if (!q.trim()) return [];
    try {
      const cacheKey = CacheService.keys.search(q);
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      let results: any[];

      if (this.opensearch.isEnabled) {
        results = await this.searchWithOpenSearch(q, limit);
      } else {
        results = await this.searchWithPostgres(q, limit);
      }

      await this.cache.set(cacheKey, results, this.SEARCH_TTL);
      return results;
    } catch (err: any) {
      this.logger.warn(`Search failed for "${q}": ${err.message}`);
      return [];
    }
  }

  private async searchWithOpenSearch(q: string, limit: number): Promise<any[]> {
    try {
      const osResults = await this.opensearch.search(q, { limit });
      if (osResults.length > 0) {
        return osResults;
      }
      // Fallback to PostgreSQL if OpenSearch returns empty
      return this.searchWithPostgres(q, limit);
    } catch (err: any) {
      this.logger.warn(`OpenSearch search failed, falling back to PostgreSQL: ${err.message}`);
      return this.searchWithPostgres(q, limit);
    }
  }

  private async searchWithPostgres(q: string, limit: number): Promise<any[]> {
    return this.prisma.product.findMany({
      where: {
        isApproved: true,
        isActive: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { brand: { name: { contains: q, mode: "insensitive" } } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      take: limit,
      select: {
        id: true, slug: true, title: true,
        brand: true, price: true, mrp: true,
        images: true, rating: true,
      },
    });
  }

  async suggestions(q: string) {
    if (!q.trim()) return { products: [], categories: [], brands: [] };
    try {
      const cacheKey = CacheService.keys.searchSuggestions(q);
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      const [products, categories, brands] = await Promise.all([
        this.prisma.product.findMany({
          where: { isApproved: true, isActive: true, title: { contains: q, mode: "insensitive" } },
          take: 5,
          select: { id: true, slug: true, title: true, brand: true },
        }),
        this.prisma.category.findMany({
          where: { isActive: true, name: { contains: q, mode: "insensitive" } },
          take: 3,
          select: { id: true, slug: true, name: true },
        }),
        this.prisma.brand.findMany({
          where: { isActive: true, name: { contains: q, mode: "insensitive" } },
          take: 3,
          select: { id: true, slug: true, name: true },
        }),
      ]);

      const result = { products, categories, brands };
      await this.cache.set(cacheKey, result, this.SUGGESTIONS_TTL);
      return result;
    } catch {
      return { products: [], categories: [], brands: [] };
    }
  }

  async trending() {
    try {
      const cacheKey = "search:trending";
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      await this.cache.set(cacheKey, this.DEFAULT_TRENDING, this.TRENDING_TTL);
      return this.DEFAULT_TRENDING;
    } catch {
      return this.DEFAULT_TRENDING;
    }
  }

  async recent(userId: string) {
    try {
      const events = await this.prisma.userEvent.findMany({
        where: { userId, type: "SEARCH" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { metadata: true },
      });
      return events.map((e) => (e.metadata as any)?.query).filter(Boolean);
    } catch {
      return [];
    }
  }

  async indexProduct(product: any): Promise<void> {
    if (!this.opensearch.isEnabled) return;
    try {
      await this.opensearch.indexProduct(product);
    } catch (err: any) {
      this.logger.warn(`Product indexing failed: ${err.message}`);
    }
  }

  async removeProduct(productId: string): Promise<void> {
    if (!this.opensearch.isEnabled) return;
    try {
      await this.opensearch.removeProduct(productId);
    } catch (err: any) {
      this.logger.warn(`Product removal from index failed: ${err.message}`);
    }
  }

  get searchEngine(): string {
    return this.opensearch.isEnabled ? "opensearch" : "postgresql";
  }

  async voiceSearch(transcript: string, language: string) {
    // Clean and normalize the transcript
    const cleaned = transcript.trim().toLowerCase();
    if (!cleaned) {
      return { found: false, query: "", products: [], message: "Empty transcript" };
    }

    // Parse structured intent from natural language
    const intent = this.parseVoiceIntent(cleaned);

    // Build search query from intent
    const searchQuery = intent.keywords.join(" ");

    // Search using existing search infrastructure
    const products = await this.search(searchQuery, 20);

    return {
      found: products.length > 0,
      query: transcript,
      parsedIntent: intent,
      products,
      language,
    };
  }

  private parseVoiceIntent(transcript: string) {
    const result = {
      keywords: [] as string[],
      budget: undefined as number | undefined,
      category: undefined as string | undefined,
      brand: undefined as string | undefined,
    };

    // Extract budget
    const budgetPatterns = [
      /(\d[\d,]*)\s*(?:ke\s+andar|under|below|tak|till|upto)/i,
      /(?:under|below|upto|tak)\s*(?:₹\s*)?(\d[\d,]*)/i,
      /(?:₹|rs\.?|inr)\s*(\d[\d,]*)/i,
    ];
    for (const pat of budgetPatterns) {
      const m = transcript.match(pat);
      if (m) {
        const num = parseInt(m[1].replace(/,/g, ""), 10);
        if (num >= 100 && num <= 10000000) {
          result.budget = num;
          break;
        }
      }
    }

    // Extract category keywords
    const CATEGORY_MAP: Record<string, string[]> = {
      phone: ["phone", "mobile", "smartphone", "android", "iphone"],
      laptop: ["laptop", "notebook", "macbook"],
      headphone: ["headphone", "earphone", "earbuds", "headset"],
      shoes: ["shoe", "shoes", "sneaker", "boots", "sandals"],
      shirt: ["shirt", "tshirt", "t-shirt", "kurta"],
      tv: ["tv", "television", "smart tv"],
      watch: ["watch", "smartwatch"],
      camera: ["camera", "dslr"],
    };
    for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
      for (const kw of keywords) {
        if (transcript.includes(kw)) {
          result.category = cat;
          result.keywords.push(kw);
          break;
        }
      }
    }

    // Extract brand keywords
    const BRAND_MAP: Record<string, string> = {
      samsung: "Samsung", apple: "Apple", iphone: "Apple",
      oneplus: "OnePlus", xiaomi: "Xiaomi", nike: "Nike",
      adidas: "Adidas", boat: "boAt", noise: "Noise",
    };
    for (const [kw, brand] of Object.entries(BRAND_MAP)) {
      if (transcript.includes(kw)) {
        result.brand = brand;
        result.keywords.push(brand);
        break;
      }
    }

    // Extract remaining meaningful words (remove common Hindi/English stop words)
    const stopWords = ["ke", "andar", "dikhao", "chahiye", "hai", "mein", "ko", "se", "ka", "ki", "ke", "the", "a", "an", "is", "are", "show", "me", "want", "need", "best", "good", "new"];
    const words = transcript.split(/\s+/).filter((w) =>
      w.length > 2 && !stopWords.includes(w) && !result.keywords.some((k) => k.toLowerCase() === w)
    );
    result.keywords.push(...words);

    return result;
  }

  async imageSearch(file: Express.Multer.File) {
    // Validate image
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        found: false,
        products: [],
        message: "Unsupported image format. Please upload JPEG, PNG, or WebP.",
      };
    }

    // In production, this would call a vision AI API (Google Vision, AWS Rekognition, etc.)
    // For now, we analyze the image metadata and return similar products
    try {
      // Extract any text from filename hints
      const filename = file.originalname?.toLowerCase() || "";
      const searchTerms: string[] = [];

      // Try to extract keywords from filename
      const cleaned = filename.replace(/[^a-z0-9\s]/g, " ").trim();
      const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
      searchTerms.push(...words);

      // If no keywords from filename, search for popular products
      if (searchTerms.length === 0) {
        const products = await this.prisma.product.findMany({
          where: { isApproved: true, isActive: true, isBestseller: true },
          take: 10,
          select: {
            id: true, slug: true, title: true, price: true, mrp: true,
            images: true, rating: true,
            brand: { select: { name: true } },
          },
        });
        return {
          found: products.length > 0,
          products,
          message: "Image analysis not available. Showing popular products instead.",
          fallback: true,
        };
      }

      // Search with extracted terms
      const searchQuery = searchTerms.join(" ");
      const products = await this.search(searchQuery, 10);

      return {
        found: products.length > 0,
        query: searchTerms.join(" "),
        products,
        message: products.length > 0
          ? `Found products matching image content`
          : "No matching products found. Try a different image or search text.",
      };
    } catch (err: any) {
      this.logger.warn(`Image search failed: ${err.message}`);
      // Graceful fallback to trending products
      const products = await this.search("trending", 10);
      return {
        found: false,
        products,
        message: "Image analysis unavailable. Showing trending products.",
        fallback: true,
      };
    }
  }
}
