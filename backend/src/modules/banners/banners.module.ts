import { Module } from "@nestjs/common";
import { BannersController } from "./banners.controller";
import { BannersService } from "./banners.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { UploadsModule } from "../uploads/uploads.module";

@Module({
  imports: [PrismaModule, UploadsModule],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
