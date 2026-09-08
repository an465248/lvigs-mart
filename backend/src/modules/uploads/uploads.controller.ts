import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { UploadsService } from "./uploads.service";

@ApiTags("Uploads")
@Controller("uploads")
export class UploadsController {
  constructor(private uploads: UploadsService) {}

  @Post("presign")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async presign(@Body() body: { filename: string; contentType: string; folder?: string }) {
    return this.uploads.getPresignedUrl(body.filename, body.contentType, body.folder);
  }

  @Post("banner")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  async uploadBanner(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
        fileIsRequired: true,
      })
    )
    file: Express.Multer.File
  ) {
    return this.uploads.uploadBannerImage(file);
  }

  @Post("product")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  async uploadProduct(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
        fileIsRequired: true,
      })
    )
    file: Express.Multer.File
  ) {
    return this.uploads.uploadProductImage(file);
  }

  @Get("validation")
  getValidation(@Query("type") type: "banner" | "product") {
    return this.uploads.getValidation(type || "banner");
  }
}
