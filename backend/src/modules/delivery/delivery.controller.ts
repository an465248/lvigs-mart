import { Controller, Get, Post, Put, Param, Query, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/auth.decorators";
import { DeliveryService } from "./delivery.service";

@ApiTags("Delivery")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("delivery")
export class DeliveryController {
  constructor(private delivery: DeliveryService) {}

  @Post("register")
  @Roles("CUSTOMER")
  @ApiOperation({ summary: "Register as delivery agent" })
  async register(@Req() req: any, @Body() body: any) {
    return this.delivery.registerAgent(req.user.id, body);
  }

  @Get("profile")
  @Roles("DELIVERY_AGENT")
  async profile(@Req() req: any) {
    return this.delivery.getAgentProfile(req.user.id);
  }

  @Put("location")
  @Roles("DELIVERY_AGENT")
  async updateLocation(@Req() req: any, @Body() body: { lat: number; lng: number }) {
    return this.delivery.updateLocation(req.user.id, body.lat, body.lng);
  }

  @Put("availability")
  @Roles("DELIVERY_AGENT")
  async toggleAvailability(@Req() req: any, @Body() body: { isAvailable: boolean }) {
    return this.delivery.toggleAvailability(req.user.id, body.isAvailable);
  }

  @Get("dashboard")
  @Roles("DELIVERY_AGENT")
  @ApiOperation({ summary: "Delivery agent dashboard" })
  async dashboard(@Req() req: any) {
    return this.delivery.getAgentDashboard(req.user.id);
  }

  @Get("deliveries")
  @Roles("DELIVERY_AGENT")
  async getDeliveries(
    @Req() req: any,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.delivery.getAssignedDeliveries(req.user.id, page, limit);
  }

  @Get("deliveries/:id")
  @Roles("DELIVERY_AGENT")
  async getDeliveryDetails(@Req() req: any, @Param("id") id: string) {
    return this.delivery.getDeliveryDetails(req.user.id, id);
  }

  @Post("deliveries/:id/accept")
  @Roles("DELIVERY_AGENT")
  async acceptDelivery(@Req() req: any, @Param("id") id: string) {
    return this.delivery.acceptDelivery(req.user.id, id);
  }

  @Put("deliveries/:id/status")
  @Roles("DELIVERY_AGENT")
  async updateStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.delivery.updateDeliveryStatus(req.user.id, id, body.status, body.notes);
  }

  @Post("deliveries/:id/failed")
  @Roles("DELIVERY_AGENT")
  async reportFailed(@Req() req: any, @Param("id") id: string, @Body() body: { reason: string }) {
    return this.delivery.reportFailedDelivery(req.user.id, id, body.reason);
  }
}
