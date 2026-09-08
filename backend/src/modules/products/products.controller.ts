import { Controller, Get, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { ListProductsDto } from "./dto/product.dto";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "List products with filters" })
  async list(@Query() dto: ListProductsDto) {
    return this.products.list(dto);
  }

  @Get("categories")
  @ApiOperation({ summary: "Get all root categories with children" })
  async categories() {
    return this.products.getCategories();
  }

  @Get("brands")
  @ApiOperation({ summary: "Get all active brands" })
  async brands() {
    return this.products.getBrands();
  }

  @Get("categories/:slug")
  @ApiOperation({ summary: "Get category by slug" })
  async category(@Param("slug") slug: string) {
    return this.products.getCategoryBySlug(slug);
  }

  @Get("compare")
  @ApiOperation({ summary: "Compare up to 4 products" })
  async compare(@Query("ids") ids: string) {
    const productIds = ids.split(",").filter(Boolean).slice(0, 4);
    return this.products.compare(productIds);
  }

  @Get("barcode/:barcode")
  @ApiOperation({ summary: "Search product by barcode (SKU/UPC/EAN/GTIN)" })
  async byBarcode(@Param("barcode") barcode: string) {
    return this.products.findByBarcode(barcode);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get product by slug with full details" })
  async getBySlug(@Param("slug") slug: string) {
    return this.products.getBySlug(slug);
  }

  @Get(":id/related")
  @ApiOperation({ summary: "Get related products" })
  async related(@Param("id") id: string, @Query("categoryId") categoryId: string, @Query("limit") limit = 6) {
    return this.products.getRelated(id, categoryId, limit);
  }
}