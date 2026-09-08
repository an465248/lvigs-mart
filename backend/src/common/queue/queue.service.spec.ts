import { Test, TestingModule } from "@nestjs/testing";
import { QueueService } from "./queue.service";
import { ConfigService } from "@nestjs/config";

describe("QueueService", () => {
  let service: QueueService;
  let config: any;

  beforeEach(async () => {
    config = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("registerHandler", () => {
    it("should register a handler for a queue", () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      service.registerHandler("test-queue", handler);
      const stats = service.getStats();
      expect(stats["test-queue"]).toEqual({ registered: true, pendingJobs: 0 });
    });

    it("should overwrite a previous handler for the same queue", () => {
      const handler1 = jest.fn().mockResolvedValue(undefined);
      const handler2 = jest.fn().mockResolvedValue(undefined);
      service.registerHandler("test-queue", handler1);
      service.registerHandler("test-queue", handler2);
      const stats = service.getStats();
      expect(Object.keys(stats)).toHaveLength(1);
    });
  });

  describe("addJob", () => {
    it("should return a job id", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      service.registerHandler("test-queue", handler);
      const jobId = await service.addJob("test-queue", { key: "value" });
      expect(jobId).toBeTruthy();
      expect(typeof jobId).toBe("string");
    });

    it("should execute the handler with job data", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      service.registerHandler("test-queue", handler);
      const data = { key: "value" };
      await service.addJob("test-queue", data);
      // Wait for async processing
      await new Promise((r) => setTimeout(r, 50));
      expect(handler).toHaveBeenCalledWith(data);
    });

    it("should process jobs asynchronously (non-blocking)", async () => {
      const callOrder: string[] = [];
      const handler = jest.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 100));
        callOrder.push("handler");
      });
      service.registerHandler("test-queue", handler);

      await service.addJob("test-queue", {});
      callOrder.push("addJob-returned");

      expect(callOrder).toEqual(["addJob-returned"]);
    });

    it("should drop job gracefully when no handler is registered", async () => {
      const jobId = await service.addJob("unknown-queue", { key: "value" });
      expect(jobId).toBeTruthy();
      expect(jobId).toContain("unknown-queue");
    });
  });

  describe("idempotency", () => {
    it("should not create duplicate jobs with same idempotencyKey", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      service.registerHandler("idem-queue", handler);

      const jobId1 = await service.addJob("idem-queue", { key: "value" }, { idempotencyKey: "key-1" });
      const jobId2 = await service.addJob("idem-queue", { key: "value" }, { idempotencyKey: "key-1" });

      expect(jobId1).toBe(jobId2);
    });

    it("should allow different idempotencyKeys", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      service.registerHandler("idem-queue", handler);

      const jobId1 = await service.addJob("idem-queue", { key: "a" }, { idempotencyKey: "key-1" });
      const jobId2 = await service.addJob("idem-queue", { key: "b" }, { idempotencyKey: "key-2" });

      expect(jobId1).not.toBe(jobId2);
    });
  });

  describe("retry with exponential backoff", () => {
    it("should retry 3 times on failure and then give up", async () => {
      let attempts = 0;
      const handler = jest.fn().mockImplementation(async () => {
        attempts++;
        throw new Error(`Attempt ${attempts} failed`);
      });
      service.registerHandler("retry-queue", handler);

      await service.addJob("retry-queue", {}, { attempts: 3 });
      await new Promise((r) => setTimeout(r, 3500));

      expect(handler).toHaveBeenCalledTimes(3);
      expect(attempts).toBe(3);
    });

    it("should use exponential backoff timing", async () => {
      const timestamps: number[] = [];
      const handler = jest.fn().mockImplementation(async () => {
        timestamps.push(Date.now());
        throw new Error("fail");
      });
      service.registerHandler("backoff-queue", handler);

      await service.addJob("backoff-queue", {}, { attempts: 3 });
      await new Promise((r) => setTimeout(r, 4000));

      expect(timestamps.length).toBe(3);
      if (timestamps.length === 3) {
        const gap1 = timestamps[1] - timestamps[0];
        const gap2 = timestamps[2] - timestamps[1];
        expect(gap1).toBeGreaterThanOrEqual(900);
        expect(gap2).toBeGreaterThanOrEqual(1900);
      }
    });

    it("should succeed on first attempt if handler does not throw", async () => {
      let attempts = 0;
      const handler = jest.fn().mockImplementation(async () => {
        attempts++;
      });
      service.registerHandler("success-queue", handler);

      await service.addJob("success-queue", {});
      await new Promise((r) => setTimeout(r, 50));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(attempts).toBe(1);
    });

    it("should use fixed backoff when specified", async () => {
      const timestamps: number[] = [];
      const handler = jest.fn().mockImplementation(async () => {
        timestamps.push(Date.now());
        throw new Error("fail");
      });
      service.registerHandler("fixed-queue", handler);

      await service.addJob("fixed-queue", {}, {
        attempts: 3,
        backoff: { type: "fixed", delay: 500 },
      });
      await new Promise((r) => setTimeout(r, 2000));

      expect(timestamps.length).toBe(3);
      if (timestamps.length === 3) {
        const gap1 = timestamps[1] - timestamps[0];
        const gap2 = timestamps[2] - timestamps[1];
        expect(gap1).toBeGreaterThanOrEqual(400);
        expect(gap2).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe("getFailedJobs", () => {
    it("should return failed jobs", async () => {
      let attempts = 0;
      const handler = jest.fn().mockImplementation(async () => {
        attempts++;
        throw new Error("fail");
      });
      service.registerHandler("fail-queue", handler);

      await service.addJob("fail-queue", { test: true }, { attempts: 1 });
      await new Promise((r) => setTimeout(r, 100));

      const failedJobs = service.getFailedJobs();
      expect(failedJobs.length).toBeGreaterThanOrEqual(1);
      expect(failedJobs[0].queue).toBe("fail-queue");
      expect(failedJobs[0].error).toBe("fail");
    });
  });

  describe("retryFailedJob", () => {
    it("should retry a failed job", async () => {
      let attempts = 0;
      const handler = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts <= 1) throw new Error("fail");
      });
      service.registerHandler("retry-fail-queue", handler);

      await service.addJob("retry-fail-queue", {}, { attempts: 1 });
      await new Promise((r) => setTimeout(r, 100));

      const failedJobs = service.getFailedJobs();
      expect(failedJobs.length).toBeGreaterThanOrEqual(1);

      const jobId = failedJobs[0].jobId;
      const retried = await service.retryFailedJob(jobId);
      expect(retried).toBe(true);
    });

    it("should return false for non-existent job", async () => {
      const retried = await service.retryFailedJob("non-existent");
      expect(retried).toBe(false);
    });
  });

  describe("clearFailedJobs", () => {
    it("should clear all failed jobs", async () => {
      let attempts = 0;
      const handler = jest.fn().mockImplementation(async () => {
        attempts++;
        throw new Error("fail");
      });
      service.registerHandler("clear-queue", handler);

      await service.addJob("clear-queue", {}, { attempts: 1 });
      await new Promise((r) => setTimeout(r, 100));

      service.clearFailedJobs();
      expect(service.getFailedJobs()).toHaveLength(0);
    });
  });

  describe("getStats", () => {
    it("should return empty object when no handlers registered", () => {
      const stats = service.getStats();
      expect(stats).toEqual({});
    });

    it("should report all registered handlers with pendingJobs", () => {
      service.registerHandler("queue-a", jest.fn().mockResolvedValue(undefined));
      service.registerHandler("queue-b", jest.fn().mockResolvedValue(undefined));
      const stats = service.getStats();
      expect(stats).toEqual({
        "queue-a": { registered: true, pendingJobs: 0 },
        "queue-b": { registered: true, pendingJobs: 0 },
      });
    });
  });

  describe("onModuleDestroy", () => {
    it("should set shutdown flag", async () => {
      await service.onModuleDestroy();
      expect((service as any).shutdownFlag).toBe(true);
    });

    it("should drop new jobs after shutdown", async () => {
      await service.onModuleDestroy();
      const handler = jest.fn().mockResolvedValue(undefined);
      service.registerHandler("post-shutdown-queue", handler);
      const jobId = await service.addJob("post-shutdown-queue", {});
      expect(jobId).toBe("");
    });
  });
});
