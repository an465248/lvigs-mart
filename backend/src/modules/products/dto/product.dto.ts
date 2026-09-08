import { IsOptional, IsString, IsNumber, Min, Max, IsIn, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ListProductsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["relevance", "price_asc", "price_desc", "rating", "newest", "popularity", "discount"])
  sort?: "relevance" | "price_asc" | "price_desc" | "rating" | "newest" | "popularity" | "discount";

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["true", "false"])
  inStock?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  colors?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  sizes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(["trending", "bestsellers", "flash-deals", "new-arrivals", "recommended", "deals-of-the-day"] as const)
  collection?: "trending" | "bestsellers" | "flash-deals" | "new-arrivals" | "recommended" | "deals-of-the-day";
}