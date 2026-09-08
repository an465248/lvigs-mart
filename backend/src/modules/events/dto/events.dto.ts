import { Injectable } from "@nestjs/common";

export class TrackEventDto {
  type: string;
  productId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}
