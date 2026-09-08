export interface AiIntent {
  budget?: number;
  category?: string;
  useCase?: string;
  brand?: string;
  color?: string;
  sort?: string;
}

export interface AiChatResponse {
  reply: string;
  products: any[];
  intent: AiIntent;
  conversationId: string;
}

export interface AiGuardrailResult {
  valid: boolean;
  reason?: string;
}

export interface AiRateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface AiContext {
  userId: string | null;
  sessionId: string;
  conversationHistory: { role: string; content: string }[];
  userPreferences: Record<string, any> | null;
  cartItems: { productId: string; title: string; price: number; quantity: number }[];
  recentlyViewed: { productId: string; title: string; price: number }[];
}

export interface AiAuditLogEntry {
  userId?: string;
  sessionId: string;
  message: string;
  reply: string;
  latencyMs: number;
  blocked: boolean;
  blockReason?: string;
}
