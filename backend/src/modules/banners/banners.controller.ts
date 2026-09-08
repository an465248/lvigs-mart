import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles, Public } from "../../common/decorators/auth.decorators";
import { BannersService } from "./banners.service";
import { UploadsService } from "../uploads/uploads.service";

@ApiTags("Banners & Offers")
@Controller("banners")
export class BannersController {
  constructor(
    private banners: BannersService,
    private uploads: UploadsService,
  ) {}

  @Get("active")
  @Public()
  @ApiOperation({ summary: "Get active banners for customer" })
  async getActiveBanners(@Query("type") type?: string) {
    return this.banners.getActiveBanners(type);
  }

  @Get("offers/active")
  @Public()
  @ApiOperation({ summary: "Get active offers for customer" })
  async getActiveOffers(@Query("type") type?: string) {
    return this.banners.getActiveOffers(type);
  }

  @Get("flash-sales/active")
  @Public()
  @ApiOperation({ summary: "Get active flash sales" })
  async getActiveFlashSales() {
    return this.banners.getActiveFlashSales();
  }

  // Admin Banner routes
  @Get("admin/banners")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async getAllBanners(
    @Query("page") page = 1,
    @Query("limit") limit = 50
  ) {
    return this.banners.getAllBanners(page, limit);
  }

  @Get("admin/banners/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async getBannerById(@Param("id") id: string) {
    return this.banners.getBannerById(id);
  }

  @Post("admin/banners")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @UseInterceptors(FilesInterceptor("images", 5))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        type: { type: "string" },
        ctaText: { type: "string" },
        ctaUrl: { type: "string" },
        sortOrder: { type: "number" },
        startsAt: { type: "string", format: "date-time" },
        endsAt: { type: "string", format: "date-time" },
        images: { type: "array", items: { type: "string", format: "binary" } },
      },
    },
  })
  async createBanner(
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    // Upload images if provided
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await this.uploads.uploadBannerImage(file);
        imageUrls.push(result.url);
      }
    }
    return this.banners.createBanner({ ...body, images: imageUrls });
  }

  @Put("admin/banners/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @UseInterceptors(FilesInterceptor("images", 5))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        type: { type: "string" },
        ctaText: { type: "string" },
        ctaUrl: { type: "string" },
        sortOrder: { type: "number" },
        isActive: { type: "boolean" },
        startsAt: { type: "string", format: "date-time" },
        endsAt: { type: "string", format: "date-time" },
        images: { type: "array", items: { type: "string", format: "binary" } },
      },
    },
  })
  async updateBanner(
    @Param("id") id: string,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    // Upload images if provided
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await this.uploads.uploadBannerImage(file);
        imageUrls.push(result.url);
      }
    }
    return this.banners.updateBanner(id, { ...body, images: imageUrls.length > 0 ? imageUrls : body.images });
  }

  @Patch("admin/banners/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @UseInterceptors(FilesInterceptor("images", 5))
  @ApiConsumes("multipart/form-data")
  async patchBanner(
    @Param("id") id: string,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await this.uploads.uploadBannerImage(file);
        imageUrls.push(result.url);
      }
    }
    return this.banners.updateBanner(id, { ...body, images: imageUrls.length > 0 ? imageUrls : body.images });
  }

  @Delete("admin/banners/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async deleteBanner(@Param("id") id: string) {
    return this.banners.deleteBanner(id);
  }

  @Patch("admin/banners/:id/toggle")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async toggleBanner(@Param("id") id: string) {
    return this.banners.toggleBannerActive(id);
  }

  @Post("admin/banners/reorder")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async reorderBanners(@Body() body: { bannerIds: string[] }) {
    return this.banners.reorderBanners(body.bannerIds);
  }

  // Admin Offer routes
  @Get("admin/offers")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async getAllOffers(
    @Query("page") page = 1,
    @Query("limit") limit = 50
  ) {
    return this.banners.getAllOffers(page, limit);
  }

  @Post("admin/offers")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async createOffer(@Body() body: any) {
    return this.banners.createOffer(body);
  }

  @Put("admin/offers/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async updateOffer(@Param("id") id: string, @Body() body: any) {
    return this.banners.updateOffer(id, body);
  }

  @Delete("admin/offers/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async deleteOffer(@Param("id") id: string) {
    return this.banners.deleteOffer(id);
  }

  // Admin Flash Sale routes
  @Get("admin/flash-sales")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async getAllFlashSales(
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ) {
    return this.banners.getAllFlashSales(page, limit);
  }

  @Post("admin/flash-sales")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async createFlashSale(@Body() body: any) {
    return this.banners.createFlashSale(body);
  }

  @Put("admin/flash-sales/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async updateFlashSale(@Param("id") id: string, @Body() body: any) {
    return this.banners.updateFlashSale(id, body);
  }

  @Delete("admin/flash-sales/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  async deleteFlashSale(@Param("id") id: string) {
    return this.banners.deleteFlashSale(id);
  }
}
