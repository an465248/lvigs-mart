import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
import { ProductsService } from "../products/products.service";
import { AiGuardrailsService } from "./ai.guardrails";
import { AiContextService } from "./ai.context.service";

export interface AiProvider {
  chat(messages: { role: string; content: string }[]): Promise<string>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private provider: AiProvider | null = null;
  private providerName: string;

  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
    private redis: RedisService,
    private config: ConfigService,
    private guardrails: AiGuardrailsService,
    private contextService: AiContextService,
  ) {
    this.providerName = this.config.get("AI_PROVIDER") || "local";
    this.initProvider();
  }

  private initProvider() {
    switch (this.providerName) {
      case "openai":
        this.provider = new OpenAiProvider(this.config);
        break;
      case "anthropic":
        this.provider = new AnthropicProvider(this.config);
        break;
      default:
        this.provider = null;
        this.logger.log("Using local NLP provider (no LLM configured)");
    }
  }

  async chat(userId: string | null, sessionId: string, message: string) {
    const start = Date.now();
    const ip = "unknown";

    // Rate limiting
    const rateAllowed = await this.guardrails.checkRateLimit(userId, ip);
    if (!rateAllowed) {
      return {
        reply: "Aapne bahut zyada requests bheji hain. Please kuch der baad try karein.",
        products: [],
        intent: {},
        conversationId: "",
        rateLimited: true,
      };
    }

    // Input validation
    const inputCheck = this.guardrails.validateInput(message);
    if (!inputCheck.valid) {
      this.guardrails.logAiRequest({
        userId: userId || undefined,
        sessionId,
        message,
        reply: "",
        latencyMs: Date.now() - start,
        blocked: true,
        blockReason: inputCheck.reason,
      });
      return {
        reply: "Maaf kijiye, aapka message process nahi ho sakta. Kripya ek simple shopping query bhejein.",
        products: [],
        intent: {},
        conversationId: "",
        blocked: true,
      };
    }

    // Build context
    const context = userId
      ? await this.contextService.buildContext(userId, sessionId)
      : { recentMessages: [], cartItems: [], recentProducts: [], preferences: null };

    // Extract intent (always works, even without LLM)
    const intent = this.extractIntent(message);

    // Log search query
    const query = await this.prisma.aiSearchQuery.create({
      data: {
        userId,
        query: message,
        parsed: intent as any,
      },
    });

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(userId, sessionId, message);

    // Save user message
    await this.prisma.aiConversationMessage.create({
      data: { conversationId: conversation.id, role: "user", content: message },
    });

    // Search products using real data
    const searchResult = await this.searchProducts(intent, 10);

    // Generate response
    let reply: string;
    let products: any[] = [];

    if (this.provider && this.config.get("AI_API_KEY")) {
      // Use LLM for natural response
      try {
        const systemPrompt = this.buildSystemPrompt(context);
        const userPrompt = this.buildUserPrompt(message, intent, searchResult);
        reply = await this.provider.chat([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]);
        products = searchResult;
      } catch (err: any) {
        this.logger.warn(`LLM failed, falling back to local: ${err.message}`);
        reply = this.buildLocalResponse(intent, searchResult);
        products = searchResult;
      }
    } else {
      // Local response generation
      reply = this.buildLocalResponse(intent, searchResult);
      products = searchResult;
    }

    // Output validation
    const outputCheck = this.guardrails.validateOutput(reply);
    reply = outputCheck.sanitized;

    const latencyMs = Date.now() - start;

    // Update search query stats
    await this.prisma.aiSearchQuery.update({
      where: { id: query.id },
      data: { results: products.length, latencyMs },
    });

    // Save assistant message
    await this.prisma.aiConversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        metadata: { intent, products: products.map((p) => p.id), count: products.length },
      },
    });

    // Audit log
    this.guardrails.logAiRequest({
      userId: userId || undefined,
      sessionId,
      message,
      reply,
      latencyMs,
      blocked: false,
    });

    return {
      reply,
      products,
      intent,
      conversationId: conversation.id,
    };
  }

  private extractIntent(message: string) {
    return {
      budget: this.extractBudget(message),
      category: this.extractCategory(message),
      useCase: this.extractUseCase(message),
      brand: this.extractBrand(message),
      color: this.extractColor(message),
      sort: this.extractSort(message),
    };
  }

  private extractBudget(message: string): number | undefined {
    const patterns = [
      /(\d[\d,]*)\s*(?:ke\s+(?:andar|neeche|under|below|tak|till|upto|up\s*to))/i,
      /(?:under|below|less\s+than|upto|up\s*to|tak|neeche|kam|saste?|budget\s+(?:of\s+)?|max(?:imum)?\s*(?:budget)?|under)\s*(?:₹\s*)?(\d[\d,]*)/i,
      /(?:₹|rs\.?|inr)\s*(\d[\d,]*)/i,
      /(\d[\d,]*)\s*(?:rupees?|₹|rs)/i,
      /budget\s+(?:of\s+)?(\d[\d,]*)/i,
    ];
    for (const pat of patterns) {
      const m = message.match(pat);
      if (m) {
        const num = parseInt(m[1].replace(/,/g, ""), 10);
        if (num >= 100 && num <= 10000000) return num;
      }
    }
    return undefined;
  }

  private extractCategory(message: string): string | undefined {
    const CATEGORY_KEYWORDS: Record<string, string[]> = {
      smartphone: ["phone", "mobile", "smartphone", "android", "iphone", "galaxy"],
      laptop: ["laptop", "notebook", "macbook"],
      tablet: ["tablet", "ipad", "tab"],
      headphone: ["headphone", "earphone", "earbuds", "headset"],
      footwear: ["shoes", "sneaker", "boots", "slippers", "sandals"],
      clothing: ["shirt", "tshirt", "jeans", "pants", "kurta", "saree", "dress"],
      watch: ["watch", "smartwatch"],
      camera: ["camera", "dslr", "gopro"],
      tv: ["tv", "television", "smart tv", "monitor"],
      appliance: ["washing machine", "refrigerator", "ac", "microwave"],
      gaming: ["gaming", "ps5", "playstation", "xbox"],
      beauty: ["makeup", "skincare", "cream", "serum"],
    };
    const lower = message.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) return cat;
      }
    }
    return undefined;
  }

  private extractUseCase(message: string): string | undefined {
    const USE_CASE_KEYWORDS: Record<string, string[]> = {
      gaming: ["gaming", "game", "bgmi", "pubg"],
      coding: ["coding", "programming", "development"],
      photography: ["photo", "photography", "camera", "selfie"],
      fitness: ["fitness", "gym", "workout", "running"],
      work: ["office", "work", "professional"],
      travel: ["travel", "trip", "journey"],
      study: ["study", "student", "education"],
      music: ["music", "song", "audio", "bass"],
    };
    const lower = message.toLowerCase();
    for (const [uc, keywords] of Object.entries(USE_CASE_KEYWORDS)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) return uc;
      }
    }
    return undefined;
  }

  private extractBrand(message: string): string | undefined {
    const BRAND_KEYWORDS: Record<string, string> = {
      samsung: "Samsung", apple: "Apple", iphone: "Apple",
      oneplus: "OnePlus", xiaomi: "Xiaomi", redmi: "Xiaomi",
      realme: "Realme", vivo: "Vivo", oppo: "Oppo",
      nike: "Nike", adidas: "Adidas", puma: "Puma",
      boat: "boAt", noise: "Noise", jbl: "JBL",
    };
    const lower = message.toLowerCase();
    for (const [kw, brand] of Object.entries(BRAND_KEYWORDS)) {
      if (lower.includes(kw)) return brand;
    }
    return undefined;
  }

  private extractColor(message: string): string | undefined {
    const COLORS = ["black", "white", "blue", "red", "green", "yellow", "pink", "grey", "brown", "orange", "purple", "gold", "silver"];
    const lower = message.toLowerCase();
    for (const color of COLORS) {
      if (lower.includes(color)) return color;
    }
    return undefined;
  }

  private extractSort(message: string): string | undefined {
    const lower = message.toLowerCase();
    if (lower.match(/cheap|sasta|budget|low\s*price/)) return "price_asc";
    if (lower.match(/expensive|premium|best\s*quality/)) return "price_desc";
    if (lower.match(/popular|best\s*selling|trending|best/)) return "rating";
    if (lower.match(/new|latest|arrival/)) return "newest";
    return undefined;
  }

  private async searchProducts(intent: any, limit: number) {
    const where: any = { isApproved: true, isActive: true };

    if (intent.budget) where.price = { lte: intent.budget };
    if (intent.brand) {
      const brand = await this.prisma.brand.findFirst({
        where: { name: { contains: intent.brand, mode: "insensitive" } },
      });
      if (brand) where.brandId = brand.id;
    }
    if (intent.category) {
      const cat = await this.prisma.category.findFirst({
        where: { isActive: true, OR: [
          { name: { contains: intent.category, mode: "insensitive" } },
          { slug: { contains: intent.category, mode: "insensitive" } },
        ] },
      });
      if (cat) where.categoryId = cat.id;
    }
    if (intent.color) {
      where.OR = [
        { title: { contains: intent.color, mode: "insensitive" } },
        { tags: { has: intent.color.toLowerCase() } },
      ];
    }

    const orderBy: any = {};
    switch (intent.sort) {
      case "price_asc": orderBy.price = "asc"; break;
      case "price_desc": orderBy.price = "desc"; break;
      case "rating": orderBy.rating = "desc"; break;
      case "newest": orderBy.createdAt = "desc"; break;
      default: orderBy.rating = "desc";
    }

    return this.prisma.product.findMany({
      where, orderBy, take: limit,
      select: {
        id: true, slug: true, title: true, price: true, mrp: true,
        images: true, rating: true, ratingCount: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });
  }

  private buildSystemPrompt(context: any): string {
    let prompt = `You are LVIGS Mart's AI shopping assistant. Help customers find products in Hindi or English.
Rules:
- Only recommend products from the actual database (never fabricate)
- Always mention real prices from the database
- Never invent discounts, delivery dates, or stock information
- Be helpful and friendly
- Use simple Hindi or English`;
    if (context.cartItems?.length > 0) {
      prompt += `\nUser's cart: ${context.cartItems.map((i: any) => i.product?.title).join(", ")}`;
    }
    if (context.preferences) {
      prompt += `\nUser prefers: ${context.preferences.topCategories?.join(", ") || "general"}`;
    }
    return prompt;
  }

  private buildUserPrompt(message: string, intent: any, products: any[]): string {
    let prompt = `Customer message: "${message}"\n\nParsed intent: ${JSON.stringify(intent)}\n\n`;
    if (products.length > 0) {
      prompt += `Matching products from database:\n`;
      products.slice(0, 5).forEach((p, i) => {
        const discount = p.mrp > p.price ? ` (${Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off)` : "";
        prompt += `${i + 1}. ${p.title} - ₹${p.price}${discount} | Rating: ${p.rating || "N/A"}\n`;
      });
    } else {
      prompt += `No matching products found.\n`;
    }
    prompt += `\nRespond in 2-3 sentences. If products found, mention top 3 with prices. If none found, suggest alternatives.`;
    return prompt;
  }

  private buildLocalResponse(intent: any, products: any[]): string {
    if (products.length === 0) {
      const parts: string[] = [];
      if (intent.budget) parts.push(`₹${intent.budget.toLocaleString("en-IN")} ke andar`);
      if (intent.brand) parts.push(intent.brand);
      if (intent.category) parts.push(intent.category);
      const desc = parts.length > 0 ? parts.join(" ") : "ye criteria";
      return `Sorry, "${desc}" ke liye abhi koi product nahi mila. Aap apna budget ya preferences change karke dubara try kar sakte hain.`;
    }

    const parts: string[] = [];
    if (intent.budget) parts.push(`₹${intent.budget.toLocaleString("en-IN")} ke andar`);
    if (intent.brand) parts.push(intent.brand);
    if (intent.category) parts.push(intent.category);
    if (intent.color) parts.push(intent.color);
    const desc = parts.length > 0 ? parts.join(" ") : "aapke liye";

    let reply = `Maine "${desc}" ke liye ${products.length} products dhundhe hain:\n\n`;
    products.slice(0, 5).forEach((p, i) => {
      const discount = p.mrp > p.price ? ` (${Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off)` : "";
      reply += `${i + 1}. ${p.title} — ₹${p.price.toLocaleString("en-IN")}`;
      if (discount) reply += ` (${discount} off)`;
      if (p.rating > 0) reply += ` | ★ ${p.rating}`;
      reply += "\n";
    });
    if (products.length > 5) reply += `\n...aur ${products.length - 5} products aur available hain.`;
    reply += "\n\nKya aap inme se kisi product ke baare mein detail jaanna chahte hain?";
    return reply;
  }

  private async getOrCreateConversation(userId: string | null, sessionId: string, message: string) {
    const where = userId
      ? { userId, sessionId }
      : { sessionId, userId: null };

    let conversation = await this.prisma.aiConversation.findFirst({ where });
    if (!conversation) {
      conversation = await this.prisma.aiConversation.create({
        data: { userId, sessionId, title: message.slice(0, 80) },
      });
    }
    return conversation;
  }

  async listConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.aiConversation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
        include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
      }),
      this.prisma.aiConversation.count({ where: { userId } }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getConversation(userId: string, conversationId: string) {
    return this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }
}

// LLM Provider implementations
class OpenAiProvider implements AiProvider {
  private apiKey: string;
  private model: string;

  constructor(private config: ConfigService) {
    this.apiKey = config.get("AI_API_KEY") || "";
    this.model = config.get("AI_MODEL") || "gpt-3.5-turbo";
  }

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
  }
}

class AnthropicProvider implements AiProvider {
  private apiKey: string;
  private model: string;

  constructor(private config: ConfigService) {
    this.apiKey = config.get("AI_API_KEY") || "";
    this.model = config.get("AI_MODEL") || "claude-3-haiku-20240307";
  }

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsg = messages.filter((m) => m.role !== "system");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        system: systemMsg?.content || "",
        messages: userMsg,
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || "Sorry, I couldn't process that.";
  }
}
