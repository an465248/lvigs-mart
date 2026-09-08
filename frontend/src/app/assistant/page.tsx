"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Send, Mic, Camera, Sparkles, ArrowLeft, Star, ShoppingCart, Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { VoiceSearch } from "@/components/search/VoiceSearch";
import { ImageSearch } from "@/components/search/ImageSearch";
import { useStore } from "@/state/store";
import { formatINR, discountPercent, truncate } from "@/lib/utils";
import { aiChat, voiceSearch as apiVoiceSearch } from "@/lib/api-phase6";
import { Badge } from "@/components/ui/Badge";
import type { Product, AiMessage } from "@/lib/types";

const SUGGESTIONS = [
  "Find phones under ₹20K",
  "Best laptops for coding",
  "Trending fashion",
  "Show me today's deals",
];

const QUICK_REPLIES = [
  "Compare prices",
  "Show alternatives",
  "Read reviews",
  "Check delivery",
];

export default function AssistantPage() {
  const { user } = useStore();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    const welcomeMsg: AiMessage = {
      id: "welcome",
      role: "assistant",
      content: user
        ? `Hi ${user.name || "there"}! 👋 I'm your AI shopping assistant. I can help you find products, compare prices, check deals, and more. What are you looking for?`
        : "Hi! 👋 I'm your AI shopping assistant. I can help you find products, compare prices, check deals, and more. What are you looking for?",
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
  }, [user]);

  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const generateResponse = useCallback(async (query: string): Promise<AiMessage> => {
    try {
      const result = await aiChat(query, sessionId);
      if (result.conversationId && !sessionId) {
        setSessionId(result.conversationId);
      }
      return {
        id: "msg-" + Date.now(),
        role: "assistant",
        content: result.reply,
        products: result.products || [],
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        id: "msg-" + Date.now(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        timestamp: new Date().toISOString(),
      };
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: AiMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const assistantMsg = await generateResponse(text);
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  }, [generateResponse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-dvh flex-col bg-ink-50 dark:bg-ink-900">
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur-lg dark:border-ink-700 dark:bg-ink-900/90">
        <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/50">
            <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold">AI Assistant</h1>
            <p className="text-[10px] text-emerald-600">● Online</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/50">
              <Sparkles className="h-4 w-4 text-brand-600" />
            </div>
            <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-soft dark:bg-ink-800">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <div className="border-t border-ink-100 bg-white px-4 py-3 dark:border-ink-700 dark:bg-ink-900">
        {messages.length <= 1 && (
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <VoiceSearch
            onResult={(text) => sendMessage(text)}
          />
          <ImageSearch
            onResult={(url) => sendMessage(`Find products similar to this image: ${url.slice(0, 50)}`)}
          />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-800"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}

function MessageBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/50">
          <Sparkles className="h-4 w-4 text-brand-600" />
        </div>
      )}
      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-brand-600 text-white"
              : "rounded-tl-md bg-white shadow-soft dark:bg-ink-800"
          }`}
        >
          {message.content}
        </div>

        {message.products && message.products.length > 0 && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {message.products.map((p) => (
              <MiniProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const disc = discountPercent(product.mrp, product.price);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="w-44 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-soft transition hover:shadow-card dark:border-ink-700 dark:bg-ink-800"
    >
      <div className="relative h-32 w-full bg-ink-50 dark:bg-ink-700">
        <Image src={product.images[0]} alt={product.title} fill className="object-cover" unoptimized />
        {disc > 0 && (
          <Badge tone="accent" className="absolute left-2 top-2 text-[10px]">
            {disc}% off
          </Badge>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-[10px] text-ink-500">{product.brand}</p>
        <p className="text-xs font-semibold line-clamp-2">{truncate(product.title, 50)}</p>
        <div className="mt-1 flex items-center gap-1">
          <span className="flex items-center gap-0.5 rounded bg-emerald-600 px-1 py-0.5 text-[9px] font-bold text-white">
            {product.rating.toFixed(1)} <Star className="h-2 w-2 fill-current" />
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-sm font-bold">{formatINR(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-[10px] text-ink-500 line-through">{formatINR(product.mrp)}</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product.id);
          }}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-brand-600 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-700"
        >
          <ShoppingCart className="h-3 w-3" /> Add
        </button>
      </div>
    </Link>
  );
}
