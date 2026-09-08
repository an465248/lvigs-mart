import { Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { WishlistService } from "./wishlist.service";

@ApiTags("Wishlist")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("wishlist")
export class WishlistController {
  constructor(private wishlist: WishlistService) {}

  @Get()
  async get(@Req() req: any) {
    return this.wishlist.get(req.user.id);
  }

  @Post("toggle/:productId")
  async toggle(@Req() req: any, @Param("productId") productId: string) {
    return this.wishlist.toggle(req.user.id, productId);
  }
}