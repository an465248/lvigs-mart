import { Module, Global, Logger } from "@nestjs/common";
import { SentryService } from "./sentry.service";

@Global()
@Module({
  providers: [SentryService],
  exports: [SentryService],
})
export class SentryModule {}
