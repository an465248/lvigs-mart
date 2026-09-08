import { Controller, Get, Put, Param, Post, Query, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  async list(@Req() req: any, @Query("unread") unread = "false") {
    return this.notifications.list(req.user.id, unread === "true");
  }

  @Get("unread-count")
  async unreadCount(@Req() req: any) {
    return { count: await this.notifications.countUnread(req.user.id) };
  }

  @Post(":id/read")
  async markRead(@Req() req: any, @Param("id") id: string) {
    return this.notifications.markRead(req.user.id, id);
  }

  @Post("read-all")
  async markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(req.user.id);
  }

  @Get("preferences")
  async getPreferences(@Req() req: any) {
    return this.notifications.getPreferences(req.user.id);
  }

  @Put("preferences")
  async updatePreferences(@Req() req: any, @Body() body: Record<string, any>) {
    return this.notifications.updatePreferences(req.user.id, body);
  }
}