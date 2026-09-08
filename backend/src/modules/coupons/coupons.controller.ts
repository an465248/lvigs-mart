import { Controller, Get, Param, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { CouponsService } from "./coupons.service";

@ApiTags("Coupons")
@Controller("coupons")
export class CouponsController {
  constructor(private coupons: CouponsService) {}

  @Get()
  async list() {
    return this.coupons.list();
  }

  @Post("validate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async validate(@Body() body: { code: string; amount: number }) {
    return this.coupons.validate(body.code, body.amount);
  }
}