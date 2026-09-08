import { Controller, Get, Put, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/auth.decorators";
import { FeatureFlagsService } from "./feature-flags.service";
import { UpdateFeatureFlagDto } from "./dto/feature-flag.dto";

@ApiTags("Admin Feature Flags")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/feature-flags")
export class FeatureFlagsController {
  constructor(private featureFlags: FeatureFlagsService) {}

  @Get()
  async list() {
    const flags = await this.featureFlags.getFlags();
    const configs = await Promise.all(
      Object.keys(flags).map((key) => this.featureFlags.getFlagConfig(key)),
    );
    return { flags: configs };
  }

  @Put(":key")
  async update(@Param("key") key: string, @Body() dto: UpdateFeatureFlagDto) {
    await this.featureFlags.setFlag(key, dto.enabled);
    return this.featureFlags.getFlagConfig(key);
  }
}
