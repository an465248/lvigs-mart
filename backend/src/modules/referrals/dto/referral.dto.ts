import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApplyReferralDto {
  @ApiProperty({ description: "Referral code to apply" })
  @IsString()
  @IsNotEmpty()
  referralCode: string;
}

export class ApplyReferralQueryDto {
  @ApiPropertyOptional({ description: "User agent string" })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class ReferralCodeDto {
  @ApiPropertyOptional({ description: "Existing referral code to retrieve" })
  @IsOptional()
  @IsString()
  code?: string;
}

export class ReferralRewardsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
