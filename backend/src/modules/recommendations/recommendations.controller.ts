import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RecommendationsService } from "./recommendations.service";

@ApiTags("Recommendations")
@Controller("recommendations")
export class RecommendationsController {
  constructor(private rec: RecommendationsService) {}

  @Get("for-you")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async forYou(@Req() req: any, @Query("limit") limit = 10) {
    return this.rec.forUser(req.user.id, limit);
  }

  @Get("trending-near-you")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async trendingNearYou(@Req() req: any, @Query("limit") limit = 10) {
    return this.rec.trendingNearYou(req.user.id, limit);
  }

  @Get("because-viewed/:productId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async becauseViewed(@Req() req: any, @Param("productId") productId: string, @Query("limit") limit = 10) {
    return this.rec.becauseYouViewed(req.user.id, productId, limit);
  }

  @Get("continue-shopping")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async continueShopping(@Req() req: any, @Query("limit") limit = 10) {
    return this.rec.continueShopping(req.user.id, limit);
  }

  @Get("deals")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async personalizedDeals(@Req() req: any, @Query("limit") limit = 10) {
    return this.rec.personalizedDeals(req.user.id, limit);
  }

  @Get("categories")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async personalizedCategories(@Req() req: any, @Query("limit") limit = 10) {
    return this.rec.personalizedCategories(req.user.id, limit);
  }

  @Get("frequently-bought/:productId")
  async frequentlyBought(@Param("productId") productId: string, @Query("limit") limit = 6) {
    return this.rec.frequentlyBoughtTogether(productId, limit);
  }

  @Get("similar/:productId")
  async similar(@Param("productId") productId: string, @Query("limit") limit = 6) {
    return this.rec.similar(productId, limit);
  }
}