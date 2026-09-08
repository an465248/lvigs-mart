import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class OtpService {
  private readonly log = new Logger(OtpService.name);
  private readonly cooldownSec: number;
  private readonly ttlSec: number;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.cooldownSec = parseInt(config.get("OTP_RESEND_COOLDOWN") || "30", 10);
    this.ttlSec = parseInt(config.get("OTP_TTL_SECONDS") || "300", 10);
  }

  async send(mobile: string, purpose: "LOGIN" | "RESET" = "LOGIN") {
    const lastAttempt = await this.prisma.otpAttempt.findFirst({
      where: { mobile, purpose },
      orderBy: { createdAt: "desc" },
    });

    if (lastAttempt) {
      const sinceSec = (Date.now() - new Date(lastAttempt.createdAt).getTime()) / 1000;
      if (sinceSec < this.cooldownSec) {
        const wait = Math.ceil(this.cooldownSec - sinceSec);
        return { ok: false, retryAfter: wait, message: `Please wait ${wait}s before retrying` };
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    await this.prisma.otpAttempt.create({
      data: {
        mobile,
        codeHash,
        purpose,
        expiresAt: new Date(Date.now() + this.ttlSec * 1000),
      },
    });

    if (this.config.get("DEV_OTP_LOG") === "true" || process.env.NODE_ENV !== "production") {
      this.log.warn(`[DEV OTP] ${mobile} -> ${code}`);
    } else {
      // OTP delivery is handled by Firebase on the client side.
      // No server-side SMS provider needed.
    }
    return { ok: true, ttl: this.ttlSec };
  }

  async verify(mobile: string, code: string, purpose: "LOGIN" | "RESET" = "LOGIN") {
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const attempt = await this.prisma.otpAttempt.findFirst({
      where: { mobile, codeHash, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!attempt) return { ok: false, reason: "Invalid OTP" };
    if (new Date() > attempt.expiresAt) return { ok: false, reason: "OTP expired" };
    if (attempt.attempts >= 5) return { ok: false, reason: "Too many attempts" };

    await this.prisma.otpAttempt.update({
      where: { id: attempt.id },
      data: { consumedAt: new Date(), attempts: attempt.attempts + 1 },
    });
    return { ok: true };
  }
}