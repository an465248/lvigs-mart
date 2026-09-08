import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { CartService } from "./cart.service";
import { AddToCartDto, UpdateCartItemDto } from "./dto/cart.dto";

@ApiTags("Cart")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("cart")
export class CartController {
  constructor(private cart: CartService) {}

  @Get()
  async get(@Req() req: any) {
    return this.cart.getCart(req.user.id);
  }

  @Post()
  async add(@Req() req: any, @Body() dto: AddToCartDto) {
    return this.cart.addItem(req.user.id, dto);
  }

  @Put(":itemId")
  async update(@Req() req: any, @Param("itemId") itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cart.updateItem(req.user.id, itemId, dto);
  }

  @Delete(":itemId")
  async remove(@Req() req: any, @Param("itemId") itemId: string) {
    return this.cart.removeItem(req.user.id, itemId);
  }

  @Delete()
  async clear(@Req() req: any) {
    return this.cart.clearCart(req.user.id);
  }

  @Post("coupon")
  async applyCoupon(@Req() req: any, @Body() body: { code: string }) {
    return this.cart.applyCoupon(req.user.id, body.code);
  }

  @Delete("coupon")
  async removeCoupon(@Req() req: any) {
    return this.cart.removeCoupon(req.user.id);
  }
}