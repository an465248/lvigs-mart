import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private sentry: any = null;
  private enabled = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const dsn = this.config.get("SENTRY_DSN");
    if (!dsn) {
      this.logger.log("Sentry DSN not configured — error tracking disabled");
      return;
    }

    try {
      // @ts-ignore - dynamic import, package may not be installed
      const Sentry = await import("@sentry/node").catch(() => null);
      if (!Sentry) {
        this.logger.warn("@sentry/node not installed — run: npm install @sentry/node");
        return;
      }

      Sentry.init({
        dsn,
        environment: this.config.get("NODE_ENV", "development"),
        tracesSampleRate: this.config.get("NODE_ENV") === "production" ? 0.2 : 1.0,
        maxValueLength: 1000,
        beforeSend(event: any) {
          // Filter sensitive data
          if (event.request?.data) {
            const data = event.request.data;
            delete data.password;
            delete data.otp;
            delete data.token;
            delete data.accessToken;
            delete data.refreshToken;
          }
          if (event.contexts?.runtime?.env) {
            delete event.contexts.runtime.env.JWT_ACCESS_SECRET;
            delete event.contexts.runtime.env.JWT_REFRESH_SECRET;
            delete event.contexts.runtime.env.FIREBASE_PRIVATE_KEY;
            delete event.contexts.runtime.env.RAZORPAY_KEY_SECRET;
            delete event.contexts.runtime.env.S3_SECRET_KEY;
          }
          return event;
        },
      });

      this.sentry = Sentry;
      this.enabled = true;
      this.logger.log("Sentry initialized successfully");
    } catch (err: any) {
      this.logger.warn(`Sentry initialization failed: ${err.message}`);
    }
  }

  captureException(error: Error, context?: Record<string, any>) {
    if (!this.enabled || !this.sentry) return;
    try {
      this.sentry.withScope((scope: any) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        this.sentry.captureException(error);
      });
    } catch {
      // Silent fail — never crash the app for error reporting
    }
  }

  captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
    if (!this.enabled || !this.sentry) return;
    try {
      this.sentry.captureMessage(message, level);
    } catch {
      // Silent fail
    }
  }

  setTag(key: string, value: string) {
    if (!this.enabled || !this.sentry) return;
    try {
      this.sentry.setTag(key, value);
    } catch {
      // Silent fail
    }
  }
}
