import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/auth.decorators";
import { ReviewsService } from "./reviews.service";

@ApiTags("Reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Get("product/:productId")
  async list(@Param("productId") productId: string, @Query("page") page = 1, @Query("limit") limit = 10) {
    return this.reviews.getProductReviews(productId, page, limit);
  }

  @Get("product/:productId/stats")
  async stats(@Param("productId") productId: string) {
    return this.reviews.getStats(productId);
  }

  @Post("product/:productId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add product review (verified purchase check)" })
  async add(@Req() req: any, @Param("productId") productId: string, @Body() data: { rating: number; title?: string; body: string; images?: string[] }) {
    return this.reviews.add(req.user.id, productId, data);
  }

  @Post("seller/:sellerId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add seller review" })
  async addSellerReview(
    @Req() req: any,
    @Param("sellerId") sellerId: string,
    @Body() data: { rating: number; title?: string; body: string; orderId?: string },
  ) {
    return this.reviews.addSellerReview(req.user.id, sellerId, data);
  }

  @Get("my-reviews")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async myReviews(@Req() req: any, @Query("page") page = 1, @Query("limit") limit = 20) {
    return this.reviews.getReviewsByUser(req.user.id, page, limit);
  }

  @Put("admin/:reviewId/moderate")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async moderateReview(@Param("reviewId") reviewId: string, @Body() body: { isActive: boolean }) {
    return this.reviews.moderateReview(reviewId, body.isActive);
  }
}
