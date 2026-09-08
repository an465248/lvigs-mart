import { Controller, Get, Post, Query, Req, UseGuards, Body, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { SearchService } from "./search.service";

@ApiTags("Search")
@Controller("search")
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(@Query("q") q: string, @Query("limit") limit = 20) {
    return this.searchService.search(q, limit);
  }

  @Get("suggestions")
  async suggestions(@Query("q") q: string) {
    return this.searchService.suggestions(q);
  }

  @Get("trending")
  async trending() {
    return this.searchService.trending();
  }

  @Get("recent")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async recent(@Req() req: any) {
    return this.searchService.recent(req.user.id);
  }

  @Post("voice")
  @ApiConsumes("application/json")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        transcript: { type: "string", description: "Speech-to-text transcript" },
        language: { type: "string", enum: ["en", "hi"], default: "en" },
      },
      required: ["transcript"],
    },
  })
  async voiceSearch(@Body() body: { transcript: string; language?: string }) {
    return this.searchService.voiceSearch(body.transcript, body.language || "en");
  }

  @Post("image")
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: { type: "string", format: "binary" },
      },
    },
  })
  async imageSearch(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { found: false, products: [], message: "No image provided" };
    }
    return this.searchService.imageSearch(file);
  }
}
