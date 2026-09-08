import { Controller, Get, Post, Put, Param, Query, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/auth.decorators";
import { SupportService } from "./support.service";

@ApiTags("Support")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("support")
export class SupportController {
  constructor(private support: SupportService) {}

  @Post("tickets")
  @Roles("CUSTOMER")
  @ApiOperation({ summary: "Create support ticket" })
  async createTicket(@Req() req: any, @Body() body: any) {
    return this.support.createTicket(req.user.id, body);
  }

  @Get("tickets")
  @Roles("CUSTOMER")
  async getTickets(
    @Req() req: any,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("status") status?: string,
  ) {
    return this.support.getTickets(req.user.id, page, limit, status);
  }

  @Get("tickets/:id")
  @Roles("CUSTOMER")
  async getTicket(@Req() req: any, @Param("id") id: string) {
    return this.support.getTicket(req.user.id, id);
  }

  @Post("tickets/:id/messages")
  @Roles("CUSTOMER")
  async addMessage(@Req() req: any, @Param("id") id: string, @Body() body: { message: string; attachments?: string[] }) {
    return this.support.addMessage(req.user.id, id, body.message, body.attachments);
  }

  // Admin routes
  @Get("admin/tickets")
  @Roles("ADMIN")
  async adminGetTickets(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("status") status?: string,
    @Query("assignedTo") assignedTo?: string,
  ) {
    return this.support.getAllTickets(page, limit, status, assignedTo);
  }

  @Get("admin/stats")
  @Roles("ADMIN")
  async getStats() {
    return this.support.getTicketStats();
  }

  @Put("admin/tickets/:id/assign")
  @Roles("ADMIN")
  async assignTicket(@Param("id") id: string, @Req() req: any) {
    return this.support.assignTicket(id, req.user.id);
  }

  @Put("admin/tickets/:id/status")
  @Roles("ADMIN")
  async updateStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.support.updateTicketStatus(id, body.status);
  }

  @Post("admin/tickets/:id/reply")
  @Roles("ADMIN")
  async adminReply(@Param("id") id: string, @Req() req: any, @Body() body: { message: string; attachments?: string[] }) {
    return this.support.adminReply(id, req.user.id, body.message, body.attachments);
  }
}
