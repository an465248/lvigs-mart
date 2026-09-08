import { IsOptional, IsNumber, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class AddToCartDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity?: number = 1;
}

export class UpdateCartItemDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity!: number;
}