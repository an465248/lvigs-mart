import { Controller, Get, Post, Body, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { Public } from "../../common/decorators/auth.decorators";
import { EventsService } from "./events.service";

@ApiTags("Events")
@Controller("events")
export class EventsController {
  constructor(private events: EventsService) {}

  @Post("track")
  @Public()
  async track(@Req() req: any, @Body() body: { type: string; productId?: string; sessionId?: string; metadata?: any }) {
    const userId = req.user?.id || null;
    return this.events.track(userId, body);
  }

  @Get("history")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async history(@Req() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    return this.events.history(req.user.id, +page, +limit);
  }

  @Get("trending")
  @Public()
  async trending() {
    return this.events.trendingEvents();
  }
}
