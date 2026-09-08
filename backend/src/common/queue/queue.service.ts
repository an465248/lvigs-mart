import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface Job {
  id: string;
  queue: string;
  data: any;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
  idempotencyKey?: string;
}

type JobHandler = (data: any) => Promise<void>;

interface QueueOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: "exponential" | "fixed";
    delay: number;
  };
  concurrency?: number;
  idempotencyKey?: string;
}

interface FailedJob {
  jobId: string;
  queue: string;
  data: any;
  error: string;
  attempts: number;
  failedAt: Date;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private handlers = new Map<string, JobHandler>();
  private jobs = new Map<string, Job>();
  private failedJobs: FailedJob[] = [];
  private processing = new Map<string, boolean>();
  private concurrencyCount = new Map<string, number>();
  private shutdownFlag = false;
  private redisClient: any = null;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    // Try to connect to Redis for persistent queue
    const redisUrl = this.config.get("REDIS_URL") || "redis://localhost:6379";
    try {
      const Redis = (await import("ioredis")).default;
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });
      await this.redisClient.connect();
      this.logger.log("Redis connected for queue persistence");
    } catch (err: any) {
      this.logger.warn(`Redis connection failed for queue: ${err.message}. Using in-memory queue.`);
      this.redisClient = null;
    }
  }

  /**
   * Register a handler for a queue.
   */
  registerHandler(queueName: string, handler: JobHandler): void {
    this.handlers.set(queueName, handler);
    this.logger.log(`Registered handler for queue: ${queueName}`);
  }

  /**
   * Add a job to a queue with idempotency support.
   */
  async addJob(
    queueName: string,
    data: any,
    options?: QueueOptions
  ): Promise<string> {
    if (this.shutdownFlag) {
      this.logger.warn(`Queue shutting down, job ${queueName} dropped`);
      return "";
    }

    // Check idempotency
    if (options?.idempotencyKey) {
      const existingJob = await this.findJobByIdempotencyKey(options.idempotencyKey);
      if (existingJob) {
        this.logger.debug(`Job with idempotency key ${options.idempotencyKey} already exists`);
        return existingJob.id;
      }
    }

    const jobId = `${queueName}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const handler = this.handlers.get(queueName);

    if (!handler) {
      this.logger.warn(`No handler registered for queue: ${queueName}. Job ${jobId} dropped.`);
      return jobId;
    }

    const job: Job = {
      id: jobId,
      queue: queueName,
      data,
      status: "pending",
      attempts: 0,
      maxAttempts: options?.attempts || 3,
      createdAt: new Date(),
      idempotencyKey: options?.idempotencyKey,
    };

    this.jobs.set(jobId, job);

    // Persist to Redis if available
    if (this.redisClient) {
      try {
        await this.redisClient.hset(
          `job:${jobId}`,
          "id", jobId,
          "queue", queueName,
          "data", JSON.stringify(data),
          "status", "pending",
          "attempts", "0",
          "maxAttempts", String(job.maxAttempts),
          "createdAt", job.createdAt.toISOString(),
          "idempotencyKey", options?.idempotencyKey || ""
        );
        await this.redisClient.expire(`job:${jobId}`, 86400); // 24h TTL
      } catch (err: any) {
        this.logger.warn(`Failed to persist job to Redis: ${err.message}`);
      }
    }

    // Process async (non-blocking)
    const concurrency = options?.concurrency || 10;
    const currentConcurrency = this.concurrencyCount.get(queueName) || 0;

    if (currentConcurrency < concurrency) {
      this.processJob(jobId, queueName, data, handler, job.maxAttempts, options?.backoff).catch(
        (err) => {
          this.logger.error(`Unhandled error in job ${jobId}: ${err.message}`);
        }
      );
    } else {
      this.logger.debug(`Queue ${queueName} at concurrency limit, job ${jobId} queued`);
    }

    return jobId;
  }

  private async processJob(
    jobId: string,
    queueName: string,
    data: any,
    handler: JobHandler,
    maxAttempts: number,
    backoff?: { type: "exponential" | "fixed"; delay: number }
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const currentCount = this.concurrencyCount.get(queueName) || 0;
    this.concurrencyCount.set(queueName, currentCount + 1);

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (this.shutdownFlag) {
          this.logger.warn(`Queue shutting down, aborting job ${jobId}`);
          return;
        }

        job.attempts = attempt;
        job.status = "processing";

        try {
          await handler(data);
          job.status = "completed";
          job.processedAt = new Date();
          this.logger.debug(`Job ${jobId} completed on attempt ${attempt}`);
          return;
        } catch (err: any) {
          job.error = err.message;
          this.logger.warn(`Job ${jobId} attempt ${attempt}/${maxAttempts} failed: ${err.message}`);

          if (attempt === maxAttempts) {
            job.status = "failed";
            job.failedAt = new Date();
            this.failedJobs.push({
              jobId,
              queue: queueName,
              data,
              error: err.message,
              attempts: maxAttempts,
              failedAt: new Date(),
            });
            this.logger.error(`Job ${jobId} failed after ${maxAttempts} attempts: ${err.message}`);

            // Persist failed job to Redis
            if (this.redisClient) {
              try {
                await this.redisClient.lpush(
                  "failed-jobs",
                  JSON.stringify({
                    jobId,
                    queue: queueName,
                    data,
                    error: err.message,
                    attempts: maxAttempts,
                    failedAt: new Date().toISOString(),
                  })
                );
              } catch (redisErr: any) {
                this.logger.warn(`Failed to persist failed job to Redis: ${redisErr.message}`);
              }
            }
            return;
          }

          // Calculate delay based on backoff strategy
          let delay: number;
          if (backoff?.type === "fixed") {
            delay = backoff.delay || 1000;
          } else {
            // Default exponential backoff: 1s, 2s, 4s, 8s...
            delay = Math.pow(2, attempt - 1) * (backoff?.delay || 1000);
          }

          await new Promise((r) => setTimeout(r, delay));
        }
      }
    } finally {
      const currentCount = this.concurrencyCount.get(queueName) || 0;
      this.concurrencyCount.set(queueName, Math.max(0, currentCount - 1));
    }
  }

  private async findJobByIdempotencyKey(key: string): Promise<Job | undefined> {
    for (const job of this.jobs.values()) {
      if (job.idempotencyKey === key) {
        return job;
      }
    }

    // Check Redis
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys("job:*");
        for (const redisKey of keys) {
          const idempotencyKey = await this.redisClient.hget(redisKey, "idempotencyKey");
          if (idempotencyKey === key) {
            const id = await this.redisClient.hget(redisKey, "id");
            const queue = await this.redisClient.hget(redisKey, "queue");
            const data = await this.redisClient.hget(redisKey, "data");
            return {
              id: id || "",
              queue: queue || "",
              data: data ? JSON.parse(data) : {},
              status: "pending",
              attempts: 0,
              maxAttempts: 3,
              createdAt: new Date(),
              idempotencyKey: key,
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to check idempotency in Redis: ${err.message}`);
      }
    }

    return undefined;
  }

  /**
   * Get queue stats (for health checks).
   */
  getStats(): Record<string, { registered: boolean; pendingJobs: number }> {
    const stats: Record<string, { registered: boolean; pendingJobs: number }> = {};
    for (const [name] of this.handlers) {
      const pendingJobs = Array.from(this.jobs.values()).filter(
        (j) => j.queue === name && j.status === "pending"
      ).length;
      stats[name] = { registered: true, pendingJobs };
    }
    return stats;
  }

  /**
   * Get failed jobs for inspection.
   */
  getFailedJobs(): FailedJob[] {
    return [...this.failedJobs];
  }

  /**
   * Retry a failed job.
   */
  async retryFailedJob(jobId: string): Promise<boolean> {
    const failedIndex = this.failedJobs.findIndex((j) => j.jobId === jobId);
    if (failedIndex === -1) return false;

    const failedJob = this.failedJobs[failedIndex];
    const handler = this.handlers.get(failedJob.queue);
    if (!handler) return false;

    this.failedJobs.splice(failedIndex, 1);
    await this.addJob(failedJob.queue, failedJob.data, { attempts: 3 });
    return true;
  }

  /**
   * Clear all failed jobs.
   */
  clearFailedJobs(): void {
    this.failedJobs = [];
  }

  async onModuleDestroy() {
    this.shutdownFlag = true;
    this.logger.log("QueueService shutting down...");

    // Wait for active jobs to complete (max 5 seconds)
    const maxWait = 5000;
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const activeJobs = Array.from(this.jobs.values()).filter(
        (j) => j.status === "processing"
      );
      if (activeJobs.length === 0) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {
        this.redisClient.disconnect();
      }
    }

    this.logger.log("QueueService shutdown complete");
  }
}
