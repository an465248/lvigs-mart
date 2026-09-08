import { Controller, Get } from "@nestjs/common";

@Controller()
export class RootController {
  @Get()
  root() {
    return {
      name: "LVIGS Mart API",
      version: "1.0",
      status: "ok",
      time: new Date().toISOString(),
      docs: "/api/docs",
      health: "/api/health",
      products: "/api/products",
      search: "/api/search",
      categories: "/api/products/categories",
      brands: "/api/products/brands",
      banners: "/api/banners/active",
    };
  }
}
