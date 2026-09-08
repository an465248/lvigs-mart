import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BrandsService } from "./brands.service";

@ApiTags("Brands")
@Controller("brands")
export class BrandsController {
  constructor(private brands: BrandsService) {}

  @Get()
  async all() {
    return this.brands.getAll();
  }
}