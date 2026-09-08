import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";

@ApiTags("Categories")
@Controller("categories")
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @Get()
  async all() {
    return this.categories.getAll();
  }

  @Get(":slug")
  async bySlug(@Param("slug") slug: string) {
    return this.categories.getBySlug(slug);
  }
}