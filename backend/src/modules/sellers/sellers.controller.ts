import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/auth.decorators";
import { SellersService } from "./sellers.service";

@ApiTags("Sellers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("sellers")
export class SellersController {
  constructor(private sellers: SellersService) {}

  @Post("register")
  @Roles("CUSTOMER")
  @ApiOperation({ summary: "Register as a seller" })
  async register(@Req() req: any, @Body() body: any) {
    return this.sellers.register(req.user.id, body);
  }

  @Get("profile")
  @Roles("SELLER")
  async profile(@Req() req: any) {
    return this.sellers.getProfile(req.user.id);
  }

  @Put("profile")
  @Roles("SELLER")
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.sellers.updateProfile(req.user.id, body);
  }

  @Put("bank-account")
  @Roles("SELLER")
  async updateBankAccount(@Req() req: any, @Body() body: any) {
    return this.sellers.updateBankAccount(req.user.id, body);
  }

  @Post("documents")
  @Roles("SELLER")
  async uploadDocument(@Req() req: any, @Body() body: any) {
    return this.sellers.uploadDocument(req.user.id, body);
  }

  @Get("dashboard")
  @Roles("SELLER")
  @ApiOperation({ summary: "Seller dashboard stats" })
  async dashboard(@Req() req: any) {
    return this.sellers.getDashboard(req.user.id);
  }

  @Get("sales-chart")
  @Roles("SELLER")
  async salesChart(@Req() req: any, @Query("days") days = 30) {
    return this.sellers.getSalesChart(req.user.id, days);
  }

  // Products
  @Get("products")
  @Roles("SELLER")
  async getProducts(@Req() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    return this.sellers.getProducts(req.user.id, page, limit);
  }

  @Post("products")
  @Roles("SELLER")
  @ApiOperation({ summary: "Add a product" })
  async addProduct(@Req() req: any, @Body() body: any) {
    return this.sellers.addProduct(req.user.id, body);
  }

  @Put("products/:id")
  @Roles("SELLER")
  async updateProduct(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.sellers.updateProduct(req.user.id, id, body);
  }

  @Delete("products/:id")
  @Roles("SELLER")
  async deleteProduct(@Req() req: any, @Param("id") id: string) {
    return this.sellers.deleteProduct(req.user.id, id);
  }

  @Post("products/:id/submit")
  @Roles("SELLER")
  async submitProduct(@Req() req: any, @Param("id") id: string) {
    return this.sellers.submitProductForApproval(req.user.id, id);
  }

  // Orders
  @Get("orders")
  @Roles("SELLER")
  async getOrders(
    @Req() req: any,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("status") status?: string,
  ) {
    return this.sellers.getSellerOrders(req.user.id, page, limit, status);
  }

  @Put("orders/:id/status")
  @Roles("SELLER")
  async updateOrderStatus(@Req() req: any, @Param("id") id: string, @Body() body: { status: string }) {
    return this.sellers.updateSellerOrderStatus(req.user.id, id, body.status);
  }

  // Inventory
  @Get("inventory")
  @Roles("SELLER")
  async getInventory(@Req() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    return this.sellers.getInventory(req.user.id, page, limit);
  }

  @Put("inventory/:id")
  @Roles("SELLER")
  async updateInventory(@Req() req: any, @Param("id") id: string, @Body() body: { quantity: number }) {
    return this.sellers.updateInventoryStock(req.user.id, id, body.quantity);
  }

  @Get("inventory/:productId/history")
  @Roles("SELLER")
  async inventoryHistory(@Req() req: any, @Param("productId") productId: string) {
    return this.sellers.getInventoryHistory(req.user.id, productId);
  }

  // Payouts
  @Get("payouts")
  @Roles("SELLER")
  async getPayouts(@Req() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    return this.sellers.getPayouts(req.user.id, page, limit);
  }

  @Get("balance")
  @Roles("SELLER")
  async getBalance(@Req() req: any) {
    return this.sellers.getBalance(req.user.id);
  }

  // Reviews
  @Get("reviews")
  @Roles("SELLER")
  async getReviews(@Req() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    return this.sellers.getSellerReviews(req.user.id, page, limit);
  }

  // Returns
  @Get("returns")
  @Roles("SELLER")
  async getReturns(@Req() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    return this.sellers.getReturns(req.user.id, page, limit);
  }
}
