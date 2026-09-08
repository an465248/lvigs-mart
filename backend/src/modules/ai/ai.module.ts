import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiGuardrailsService } from "./ai.guardrails";
import { AiContextService } from "./ai.context.service";
import { ProductsModule } from "../products/products.module";

@Module({
  imports: [ProductsModule],
  controllers: [AiController],
  providers: [AiService, AiGuardrailsService, AiContextService],
  exports: [AiService],
})
export class AiModule {}
