import { Body, Controller, Get, Param, Post, Req, UseGuards, RawBodyRequest, Req as ReqDecorator } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { PaymentsService } from "./payments.service";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post("create-order/:orderId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createOrder(@Req() req: any, @Param("orderId") orderId: string) {
    return this.payments.createOrder(orderId);
  }

  @Post("verify/:orderId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async verify(@Req() req: any, @Param("orderId") orderId: string, @Body() body: any) {
    return this.payments.verifyPayment(orderId, body);
  }

  @Post("webhook/razorpay")
  async webhook(@Req() req: any, @Body() body: any) {
    const signature = req.headers?.["x-razorpay-signature"] as string || req.get("x-razorpay-signature") || "";
    return this.payments.handleWebhook(body, signature);
  }
}