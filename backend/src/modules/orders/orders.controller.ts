import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { OrdersService } from "./orders.service";
import { PlaceOrderDto, CancelOrderDto } from "./dto/order.dto";

@ApiTags("Orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  async place(@Req() req: any, @Body() dto: PlaceOrderDto) {
    return this.orders.placeOrder(req.user.id, dto);
  }

  @Get()
  async list(@Req() req: any) {
    return this.orders.getOrders(req.user.id);
  }

  @Get(":id")
  async get(@Req() req: any, @Param("id") id: string) {
    return this.orders.getOrder(req.user.id, id);
  }

  @Post(":id/cancel")
  async cancel(@Req() req: any, @Param("id") id: string, @Body() dto: CancelOrderDto) {
    return this.orders.cancelOrder(req.user.id, id, dto.reason);
  }
}