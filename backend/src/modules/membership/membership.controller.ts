import { Controller, Get, Post, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { Public } from "../../common/decorators/auth.decorators";
import { MembershipService } from "./membership.service";

@ApiTags("Membership")
@Controller("membership")
export class MembershipController {
  constructor(private membership: MembershipService) {}

  @Get("plans")
  @Public()
  async listPlans() {
    return this.membership.listPlans();
  }

  @Get("current")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getCurrent(@Req() req: any) {
    return this.membership.getCurrentSubscription(req.user.id);
  }

  @Post("subscribe")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async subscribe(@Req() req: any, @Body() body: { planId: string; billingCycle?: string }) {
    return this.membership.subscribe(req.user.id, body.planId, body.billingCycle);
  }

  @Post("cancel")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async cancel(@Req() req: any) {
    return this.membership.cancel(req.user.id);
  }
}
