import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { Public } from "../../common/decorators/auth.decorators";
import { AiService } from "./ai.service";
import { v4 as uuid } from "uuid";

@ApiTags("AI Shopping Assistant")
@Controller("ai")
export class AiController {
  constructor(private ai: AiService) {}

  @Post("chat")
  @Public()
  async chat(@Req() req: any, @Body() body: { message: string; sessionId?: string }) {
    const userId = req.user?.id || null;
    const sessionId = body.sessionId || req.headers["x-session-id"] || uuid();
    return this.ai.chat(userId, sessionId, body.message);
  }

  @Get("conversations")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listConversations(@Req() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    return this.ai.listConversations(req.user.id, +page, +limit);
  }

  @Get("conversations/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getConversation(@Req() req: any, @Param("id") id: string) {
    return this.ai.getConversation(req.user.id, id);
  }
}
