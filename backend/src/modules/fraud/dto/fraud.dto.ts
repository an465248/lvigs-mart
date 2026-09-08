import { IsString, IsOptional, IsNumber, Min, Max, IsEnum } from "class-validator";

export enum RiskAction {
  NONE = "NONE",
  FLAGGED = "FLAGGED",
  WARNING = "WARNING",
  SUSPENDED = "SUSPENDED",
}

export enum RiskReviewAction {
  CLEAR = "clear",
  FLAG = "flag",
  BLOCK = "block",
}

export class GetRiskEventsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ReviewRiskEventDto {
  @IsEnum(RiskReviewAction)
  action: RiskReviewAction;

  @IsOptional()
  @IsString()
  notes?: string;
}
