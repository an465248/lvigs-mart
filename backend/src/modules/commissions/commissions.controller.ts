import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/auth.decorators";
import { CommissionsService } from "./commissions.service";

@ApiTags("Commissions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("commissions")
export class CommissionsController {
  constructor(private commissions: CommissionsService) {}

  @Get("config")
  @Roles("ADMIN")
  async getConfigs(@Query("page") page = 1, @Query("limit") limit = 50) {
    return this.commissions.getConfigs(page, limit);
  }

  @Post("config")
  @Roles("ADMIN")
  async createConfig(@Body() body: any) {
    return this.commissions.createConfig(body);
  }

  @Put("config/:id")
  @Roles("ADMIN")
  async updateConfig(@Param("id") id: string, @Body() body: any) {
    return this.commissions.updateConfig(id, body);
  }

  @Delete("config/:id")
  @Roles("ADMIN")
  async deleteConfig(@Param("id") id: string) {
    return this.commissions.deleteConfig(id);
  }
}
