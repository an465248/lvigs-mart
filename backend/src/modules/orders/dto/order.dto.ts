import { IsString, IsNumber, IsIn, IsOptional, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class PlaceOrderDto {
  @IsString()
  addressId!: string;

  @IsString()
  @IsIn(["UPI", "CARD", "NETBANKING", "WALLET", "EMI", "COD", "PAYLATER"])
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class CancelOrderDto {
  @IsString()
  reason!: string;
}
