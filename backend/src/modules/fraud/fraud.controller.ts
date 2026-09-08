import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/auth.decorators";
import { FraudService } from "./fraud.service";
import { GetRiskEventsDto, ReviewRiskEventDto } from "./dto/fraud.dto";

@ApiTags("Fraud Detection")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("fraud")
export class FraudController {
  constructor(private fraud: FraudService) {}

  @Get("events")
  async getRiskEvents(@Query() query: GetRiskEventsDto) {
    return this.fraud.getRiskEvents(
      {
        userId: query.userId,
        type: query.type,
        riskLevel: query.riskLevel,
      },
      query.page || 1,
      query.limit || 20,
    );
  }

  @Post("events/:id/review")
  async reviewRiskEvent(
    @Param("id") id: string,
    @Body() dto: ReviewRiskEventDto,
    @Req() req: any,
  ) {
    return this.fraud.reviewRiskEvent(id, dto.action, dto.notes || "", req.user.id);
  }

  @Get("score/:userId")
  async getUserRiskScore(@Param("userId") userId: string) {
    const score = await this.fraud.getUserRiskScore(userId);
    return { userId, score };
  }
}
