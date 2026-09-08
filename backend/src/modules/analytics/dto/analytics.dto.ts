import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max } from "class-validator";

export enum AnalyticsEventType {
  APP_OPEN = "app_open",
  SEARCH = "search",
  PRODUCT_VIEW = "product_view",
  ADD_TO_CART = "add_to_cart",
  WISHLIST_ADD = "wishlist_add",
  CHECKOUT_STARTED = "checkout_started",
  PAYMENT_SUCCESS = "payment_success",
  PAYMENT_FAILED = "payment_failed",
  ORDER_CREATED = "order_created",
  ORDER_CANCELLED = "order_cancelled",
  REFUND_CREATED = "refund_created",
  REVIEW_CREATED = "review_created",
  VOICE_SEARCH = "voice_search",
  IMAGE_SEARCH = "image_search",
  AI_ASSISTANT_REQUEST = "ai_assistant_request",
}

export class TrackAnalyticsEventDto {
  @IsEnum(AnalyticsEventType)
  type: AnalyticsEventType;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class GetEventsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

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

export class GetAggregateMetricsDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
