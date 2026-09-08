import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { Public } from "../../common/decorators/auth.decorators";
import { RateLimitInterceptor } from "../../common/interceptors/rate-limit.interceptor";
import { ReferralsService } from "./referrals.service";
import {
  ApplyReferralDto,
  ReferralRewardsQueryDto,
} from "./dto/referral.dto";
import { Response } from "express";

@ApiTags("Referrals")
@Controller("referrals")
export class ReferralsController {
  constructor(private referrals: ReferralsService) {}

  @Post("code")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ description: "Generate or retrieve referral code" })
  async getCode(@Req() req: any) {
    return this.referrals.generateCode(req.user.id);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ description: "Get referral statistics" })
  async getStats(@Req() req: any) {
    return this.referrals.getReferralStats(req.user.id);
  }

  @Get("rewards")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ description: "Get reward history" })
  async getRewards(
    @Req() req: any,
    @Query() query: ReferralRewardsQueryDto,
  ) {
    return this.referrals.getRewardHistory(
      req.user.id,
      query.page,
      query.limit,
    );
  }

  @Post("apply")
  @Public()
  @UseInterceptors(new RateLimitInterceptor(60_000, 5))
  @ApiOperation({ description: "Apply referral code at signup" })
  async apply(
    @Body() dto: ApplyReferralDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.ip ||
      req.socket?.remoteAddress;
    const userAgent = req.headers["user-agent"];

    await this.referrals.attribute(
      req.body.userId,
      dto.referralCode,
      ip,
      userAgent,
    );

    res.status(HttpStatus.CREATED).json({
      message: "Referral code applied successfully",
    });
  }
}
