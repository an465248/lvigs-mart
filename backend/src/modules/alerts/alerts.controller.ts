import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { AlertsService } from "./alerts.service";

@ApiTags("Alerts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("alerts")
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Post("price")
  async createPriceAlert(@Req() req: any, @Body() body: { productId: string; targetPrice: number }) {
    return this.alerts.createPriceAlert(req.user.id, body.productId, body.targetPrice);
  }

  @Delete("price/:id")
  async removePriceAlert(@Req() req: any, @Param("id") id: string) {
    return this.alerts.removePriceAlert(req.user.id, id);
  }

  @Get("price")
  async listPriceAlerts(@Req() req: any) {
    return this.alerts.listPriceAlerts(req.user.id);
  }

  @Post("stock")
  async createStockAlert(@Req() req: any, @Body() body: { productId: string }) {
    return this.alerts.createStockAlert(req.user.id, body.productId);
  }

  @Delete("stock/:id")
  async removeStockAlert(@Req() req: any, @Param("id") id: string) {
    return this.alerts.removeStockAlert(req.user.id, id);
  }

  @Get("stock")
  async listStockAlerts(@Req() req: any) {
    return this.alerts.listStockAlerts(req.user.id);
  }
}
