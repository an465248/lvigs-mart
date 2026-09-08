import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../common/redis/redis.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AiGuardrailResult, AiAuditLogEntry } from "./ai.types";

const MAX_INPUT_LENGTH = 500;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60;

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /system\s*prompt/i,
  /you\s+are\s+(?:a|an|the)\s+/i,
  /act\s+as\s+(?:a|an|the)\s+/i,
  /pretend\s+(?:you\s+are|to\s+be|that)/i,
  /override\s+(?:instructions?|rules?|system)/i,
  /jailbreak/i,
  /ignore\s+(?:above|all|your)\s+(?:instructions?|rules?|guidelines?)/i,
  /disregard\s+(?:previous|all|above|your)/i,
  /new\s+instructions?/i,
  /forget\s+(?:everything|all|previous)/i,
  /reveal\s+(?:your|the)\s+(?:system\s+prompt|instructions?|rules?)/i,
];

const PII_PATTERNS = [
  { name: "email", regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/ },
  { name: "phone", regex: /(\+?91[\-\s]?)?[6-9]\d{9}/ },
  { name: "aadhaar", regex: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/ },
  { name: "pan", regex: /\b[A-Z]{5}\d{4}[A-Z]\b/ },
  { name: "creditCard", regex: /\b(?:\d[ \-]*?){13,19}\b/ },
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|EXECUTE)\b)/i,
  /(--|;|'|"|\\)/,
  /\bOR\b\s+\d+\s*=\s*\d+/i,
  /\bAND\b\s+\d+\s*=\s*\d+/i,
  /1\s*=\s*1/i,
  /\bSLEEP\s*\(/i,
  /\bBENCHMARK\s*\(/i,
];

const BLOCKED_COMMANDS = [
  /\bdelete\b/i,
  /\bdrop\b/i,
  /\bupdate\b.*\bset\b/i,
  /\binsert\b.*\binto\b/i,
  /\bexec\b/i,
  /\bexec\s+sp_/i,
];

@Injectable()
export class AiGuardrailsService {
  private readonly logger = new Logger(AiGuardrailsService.name);

  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  validateInput(message: string): AiGuardrailResult {
    if (!message || typeof message !== "string") {
      return { valid: false, reason: "Empty or invalid message" };
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return { valid: false, reason: "Empty message" };
    }

    if (trimmed.length > MAX_INPUT_LENGTH) {
      return { valid: false, reason: `Message exceeds ${MAX_INPUT_LENGTH} character limit` };
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        this.logger.warn(`Blocked prompt injection: ${trimmed.slice(0, 100)}`);
        return { valid: false, reason: "Blocked: prompt injection detected" };
      }
    }

    for (const pii of PII_PATTERNS) {
      if (pii.regex.test(trimmed)) {
        this.logger.warn(`Blocked PII (${pii.name}): ${trimmed.slice(0, 100)}`);
        return { valid: false, reason: `Blocked: ${pii.name} detected in input` };
      }
    }

    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        this.logger.warn(`Blocked SQL injection: ${trimmed.slice(0, 100)}`);
        return { valid: false, reason: "Blocked: SQL injection pattern detected" };
      }
    }

    for (const pattern of BLOCKED_COMMANDS) {
      if (pattern.test(trimmed)) {
        this.logger.warn(`Blocked command: ${trimmed.slice(0, 100)}`);
        return { valid: false, reason: "Blocked: forbidden command detected" };
      }
    }

    return { valid: true };
  }

  validateOutput(response: string): { valid: boolean; sanitized: string } {
    if (!response) return { valid: true, sanitized: "" };

    let sanitized = response;

    const apiKeyPatterns = [
      /(?:sk|pk|api[_-]?key|secret[_-]?key|access[_-]?key)[-_]?[A-Za-z0-9]{20,}/gi,
      /(?:RAZORPAY_KEY|STRIPE_SECRET|AWS_ACCESS)[-_]?[A-Za-z0-9]{10,}/gi,
    ];
    for (const pattern of apiKeyPatterns) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }

    const internalUrlPatterns = [
      /https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)[^\s]*/gi,
    ];
    for (const pattern of internalUrlPatterns) {
      sanitized = sanitized.replace(pattern, "[INTERNAL_URL_REDACTED]");
    }

    const dbConnectionStringPatterns = [
      /(?:postgresql|mongodb|mysql|redis):\/\/[^\s]+/gi,
    ];
    for (const pattern of dbConnectionStringPatterns) {
      sanitized = sanitized.replace(pattern, "[CONNECTION_STRING_REDACTED]");
    }

    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/<[^>]+>/g, "");

    return { valid: true, sanitized };
  }

  async checkRateLimit(userId: string | null, ip: string): Promise<boolean> {
    const key = userId ? `ai:ratelimit:user:${userId}` : `ai:ratelimit:ip:${ip}`;
    const windowKey = `${key}:window`;

    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, RATE_LIMIT_WINDOW);
      }

      if (current > RATE_LIMIT_MAX) {
        return false;
      }

      return true;
    } catch (err) {
      this.logger.warn(`Rate limit check failed: ${err}`);
      return true;
    }
  }

  logAiRequest(data: AiAuditLogEntry): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: data.userId || "anonymous",
      sessionId: data.sessionId,
      message: data.message.slice(0, 200),
      reply: data.reply.slice(0, 200),
      latencyMs: data.latencyMs,
      blocked: data.blocked,
    };

    if (data.blocked) {
      this.logger.warn(`AI_BLOCKED: ${JSON.stringify(logEntry)}`);
    } else {
      this.logger.log(`AI_REQUEST: ${JSON.stringify(logEntry)}`);
    }

    this.prisma.aiSearchQuery
      .create({
        data: {
          userId: data.userId || null,
          query: data.message.slice(0, 500),
          latencyMs: data.latencyMs,
        },
      })
      .catch((err) => this.logger.warn(`Failed to log AI audit: ${err}`));
  }
}
