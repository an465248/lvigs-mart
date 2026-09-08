import { Controller, Get, Post, Put, Query, Body, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/auth.decorators";
import { AdminService } from "./admin.service";

@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get("stats")
  async stats() {
    return this.admin.getStats();
  }

  @Get("daily-sales")
  async dailySales(@Query("days") days = 30) {
    return this.admin.getDailySalesChart(days);
  }

  @Get("top-categories")
  async topCategories() {
    return this.admin.getTopCategories();
  }

  @Get("top-products")
  async topProducts() {
    return this.admin.getTopProducts();
  }

  @Get("top-sellers")
  async topSellers() {
    return this.admin.getTopSellers();
  }

  @Get("orders-by-status")
  async ordersByStatus() {
    return this.admin.getOrdersByStatus();
  }

  // Users
  @Get("users")
  async users(@Query("page") page = 1, @Query("limit") limit = 20, @Query("search") search?: string) {
    return this.admin.getUsers(page, limit, search);
  }

  @Post("users/:id/block")
  async blockUser(@Param("id") id: string, @Body() body: { blocked: boolean }) {
    return this.admin.toggleUserBlock(id, body.blocked);
  }

  // Sellers
  @Get("sellers")
  async sellers(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    return this.admin.getSellers(page, limit, search, status);
  }

  @Get("sellers/:id")
  async sellerDetail(@Param("id") id: string) {
    return this.admin.getSellerDetail(id);
  }

  @Post("sellers/:id/approve")
  async approveSeller(@Param("id") id: string, @Req() req: any) {
    return this.admin.approveSeller(id, req.user.id);
  }

  @Post("sellers/:id/reject")
  async rejectSeller(@Param("id") id: string, @Req() req: any, @Body() body?: { reason?: string }) {
    return this.admin.rejectSeller(id, req.user.id, body?.reason);
  }

  @Post("sellers/:id/suspend")
  async suspendSeller(@Param("id") id: string, @Req() req: any, @Body() body?: { reason?: string }) {
    return this.admin.suspendSeller(id, req.user.id, body?.reason);
  }

  @Post("sellers/:id/reactivate")
  async reactivateSeller(@Param("id") id: string, @Req() req: any) {
    return this.admin.reactivateSeller(id, req.user.id);
  }

  // Product Approvals
  @Get("products/pending")
  async pendingProducts(@Query("page") page = 1, @Query("limit") limit = 20) {
    return this.admin.getPendingProducts(page, limit);
  }

  @Post("products/:approvalId/approve")
  async approveProduct(@Param("approvalId") approvalId: string, @Req() req: any) {
    return this.admin.approveProduct(approvalId, req.user.id);
  }

  @Post("products/:approvalId/reject")
  async rejectProduct(@Param("approvalId") approvalId: string, @Req() req: any, @Body() body?: { reason?: string }) {
    return this.admin.rejectProduct(approvalId, req.user.id, body?.reason);
  }

  // Orders
  @Get("orders")
  async orders(@Query("page") page = 1, @Query("limit") limit = 20, @Query("status") status?: string) {
    return this.admin.getOrders(page, limit, status);
  }

  // Config
  @Get("config")
  async getConfig() {
    return this.admin.getConfig();
  }

  @Put("config")
  async updateConfig(@Body() body: { key: string; value: any }) {
    return this.admin.updateConfig(body.key, body.value);
  }

  // Analytics
  @Get("analytics")
  async analytics() {
    return this.admin.getAnalytics();
  }

  // Fraud
  @Get("fraud-events")
  async fraudEvents(@Query("page") page = 1, @Query("limit") limit = 20) {
    return this.admin.getFraudEvents(page, limit);
  }

  @Post("fraud-events/:id/review")
  async reviewFraudEvent(@Param("id") id: string, @Body() body: { action: string }) {
    return this.admin.reviewFraudEvent(id, body.action, "");
  }

  // Audit Logs
  @Get("audit-logs")
  async auditLogs(
    @Query("page") page = 1,
    @Query("limit") limit = 50,
    @Query("action") action?: string,
    @Query("resource") resource?: string,
  ) {
    return this.admin.getAuditLogs(page, limit, action, resource);
  }

  // Payouts
  @Get("payouts")
  async getSellerPayouts(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("status") status?: string,
  ) {
    return this.admin.getSellerPayouts(page, limit, status);
  }

  @Post("payouts/:id/process")
  async processPayout(@Param("id") id: string, @Req() req: any, @Body() body: { reference: string }) {
    return this.admin.processPayout(id, req.user.id, body.reference);
  }
}
