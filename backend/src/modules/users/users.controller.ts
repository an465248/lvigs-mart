import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("profile")
  async profile(@Req() req: any) {
    return this.users.getProfile(req.user.id);
  }

  @Put("profile")
  async updateProfile(@Req() req: any, @Body() data: { name?: string; email?: string; gender?: string; dob?: string; avatar?: string; locale?: string }) {
    return this.users.updateProfile(req.user.id, data);
  }
}