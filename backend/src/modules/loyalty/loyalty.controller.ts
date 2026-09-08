import { Controller, Get, Post, Body, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { Public } from "../../common/decorators/auth.decorators";
import { LoyaltyService } from "./loyalty.service";

@ApiTags("Loyalty")
@Controller("loyalty")
export class LoyaltyController {
  constructor(private loyalty: LoyaltyService) {}

  @Get("account")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAccount(@Req() req: any) {
    return this.loyalty.getAccount(req.user.id);
  }

  @Get("transactions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getTransactions(@Req() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    return this.loyalty.getTransactions(req.user.id, +page, +limit);
  }

  @Post("redeem")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async redeem(@Req() req: any, @Body() body: { points: number; orderId?: string }) {
    return this.loyalty.redeemPoints(req.user.id, body.points, body.orderId);
  }

  @Post("earn")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async earn(@Req() req: any, @Body() body: { points: number; type: string; description?: string; referenceType?: string; referenceId?: string }) {
    return this.loyalty.earnPoints(req.user.id, body.points, body.type, body.description, body.referenceType, body.referenceId);
  }

  @Get("rules")
  @Public()
  async getRules() {
    return this.loyalty.getRules();
  }
}
