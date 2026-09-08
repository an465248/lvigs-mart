"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, X, Send, ArrowUpRight, Star, ShoppingCart } from "lucide-react";
import { useStore } from "@/state/store";
import { mockApi } from "@/lib/api";
import { formatINR, discountPercent, truncate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Product, AiMessage } from "@/lib/types";

const SUGGESTIONS = [
  "Find phones under ₹20K",
  "Best laptops for coding",
  "Trending fashion",
  "Show me today's deals",
];

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useStore();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: AiMessage = {
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm your AI shopping assistant. How can I help you today?",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, messages.length]);

  const generateResponse = useCallback(async (query: string): Promise<AiMessage> => {
    const q = query.toLowerCase();
    let responseProducts: Product[] = [];
    let content = "";

    if (q.includes("phone") || q.includes("mobile")) {
      responseProducts = (await mockApi.searchProducts("phone")).slice(0, 3);
      content = responseProducts.length > 0
        ? `Here are some phones I found:`
        : `Let me search for phones for you.`;
    } else if (q.includes("laptop") || q.includes("coding")) {
      responseProducts = (await mockApi.searchProducts("laptop")).slice(0, 3);
      content = `Here are the best laptops for coding:`;
    } else if (q.includes("deal") || q.includes("offer")) {
      responseProducts = await mockApi.getFlashDeals();
      content = `Today's best deals:`;
    } else {
      responseProducts = (await mockApi.searchProducts(q)).slice(0, 3);
      content = responseProducts.length > 0
        ? `I found these products:`
        : `Here are some trending products:`;
      if (responseProducts.length === 0) {
        responseProducts = (await mockApi.getTrendingProducts()).slice(0, 3);
      }
    }

    return {
      id: "msg-" + Date.now(),
      role: "assistant",
      content,
      products: responseProducts,
      timestamp: new Date().toISOString(),
    };
  }, []);

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
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    const assistantMsg = await generateResponse(text);
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  }, [generateResponse]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-pop transition hover:bg-brand-700 hover:scale-105 lg:bottom-6"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-end p-4 sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="relative flex w-full max-w-md flex-col rounded-2xl border border-ink-100 bg-white shadow-pop dark:border-ink-700 dark:bg-ink-900 animate-scale-in sm:h-[560px] h-[80vh]">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-700">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/50">
                  <Sparkles className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">AI Assistant</h3>
                  <p className="text-[10px] text-emerald-600">● Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href="/assistant"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
                  aria-label="Full screen"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <WidgetMessage key={msg.id} message={msg} />
              ))}
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/50">
                    <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-white px-3 py-2 shadow-soft dark:bg-ink-800">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-ink-100 px-3 py-2 dark:border-ink-700">
              {messages.length <= 1 && (
                <div className="mb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-800"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WidgetMessage({ message }: { message: AiMessage }) {
  const isUser = message.role === "user";
  const { addToCart } = useStore();

  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/50">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" />
        </div>
      )}
      <div className="max-w-[85%] space-y-2">
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-md bg-brand-600 text-white"
              : "rounded-tl-md bg-white shadow-soft dark:bg-ink-800"
          )}
        >
          {message.content}
        </div>
        {message.products && message.products.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {message.products.map((p) => {
              const disc = discountPercent(p.mrp, p.price);
              return (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="w-36 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-soft dark:border-ink-700 dark:bg-ink-800"
                >
                  <div className="relative h-24 w-full bg-ink-50 dark:bg-ink-700">
                    <Image src={p.images[0]} alt={p.title} fill className="object-cover" unoptimized />
                    {disc > 0 && <Badge tone="accent" className="absolute left-1 top-1 text-[9px]">{disc}% off</Badge>}
                  </div>
                  <div className="p-2">
                    <p className="text-[9px] text-ink-500">{p.brand}</p>
                    <p className="text-[11px] font-semibold line-clamp-1">{truncate(p.title, 40)}</p>
                    <div className="mt-0.5 flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-semibold">{p.rating.toFixed(1)}</span>
                    </div>
                    <p className="mt-0.5 text-xs font-bold">{formatINR(p.price)}</p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(p.id);
                      }}
                      className="mt-1 flex w-full items-center justify-center gap-0.5 rounded-md bg-brand-600 py-1 text-[10px] font-semibold text-white"
                    >
                      <ShoppingCart className="h-2.5 w-2.5" /> Add
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
