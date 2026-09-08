import { Controller, Get, Post, Body, Query, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Public, Roles } from "../../common/decorators/auth.decorators";
import { AnalyticsService } from "./analytics.service";
import { TrackAnalyticsEventDto, GetEventsDto, GetAggregateMetricsDto } from "./dto/analytics.dto";

@ApiTags("Analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Post("track")
  @Public()
  async track(@Req() req: any, @Body() dto: TrackAnalyticsEventDto) {
    await this.analytics.trackEvent({
      userId: req.user?.id,
      type: dto.type,
      productId: dto.productId,
      sessionId: dto.sessionId,
      metadata: dto.metadata,
    });
    return { success: true };
  }

  @Get("events")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async getEvents(@Query() query: GetEventsDto) {
    return this.analytics.getEvents(
      {
        userId: query.userId,
        type: query.type,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      },
      query.page || 1,
      query.limit || 20,
    );
  }

  @Get("metrics")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async getMetrics(@Query() query: GetAggregateMetricsDto) {
    return this.analytics.getAggregateMetrics(new Date(query.from), new Date(query.to));
  }

  @Get("funnel/:userId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async getFunnel(@Param("userId") userId: string) {
    return this.analytics.getUserFunnel(userId);
  }
}
