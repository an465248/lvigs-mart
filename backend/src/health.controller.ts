import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { RedisService } from "./common/redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  @Get()
  ping() {
    return {
      status: "ok",
      service: "lvigs-mart-api",
      time: new Date().toISOString(),
      version: "1.0.0",
    };
  }

  @Get("live")
  liveness() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  async readiness() {
    const checks: Record<string, { status: string; latencyMs?: number }> = {};
    let healthy = true;

    // Check PostgreSQL
    const pgStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.postgres = {
        status: "ok",
        latencyMs: Date.now() - pgStart,
      };
    } catch {
      checks.postgres = { status: "error", latencyMs: Date.now() - pgStart };
      healthy = false;
    }

    // Check Redis
    const redisStart = Date.now();
    try {
      const redis = (this.redis as any).client;
      if (redis?.ping) {
        await redis.ping();
        checks.redis = {
          status: "ok",
          latencyMs: Date.now() - redisStart,
        };
      } else {
        checks.redis = { status: "skip" };
      }
    } catch {
      checks.redis = { status: "error", latencyMs: Date.now() - redisStart };
      healthy = false;
    }

    return {
      status: healthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(
          process.memoryUsage().heapTotal / 1024 / 1024
        ),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };
  }
}
