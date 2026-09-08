import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { CouponsModule } from "../coupons/coupons.module";
import { CartModule } from "../cart/cart.module";

@Module({
  imports: [CouponsModule, CartModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}