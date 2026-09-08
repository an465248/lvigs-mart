"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ChevronRight, Star, TrendingUp } from "lucide-react";
import { mockApi } from "@/lib/api";
import { formatINR, discountPercent, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/lib/types";

interface DealProduct extends Product {
  dealScore: number;
  savings: number;
  validity: string;
}

export function SmartDeals() {
  const [deals, setDeals] = useState<DealProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const products = await mockApi.getDealsOfTheDay();
      if (!mounted) return;
      const scored: DealProduct[] = products.map((p, i) => ({
        ...p,
        dealScore: Math.round(85 + Math.random() * 15 - i * 2),
        savings: p.mrp - p.price,
        validity: i < 2 ? "Ends in 2h" : i < 4 ? "Ends today" : "3 days left",
      })).sort((a, b) => b.dealScore - a.dealScore);
      setDeals(scored);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  if (loading || deals.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-accent-500 text-white shadow-soft">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Smart Deals</h2>
            <p className="text-xs text-ink-500">Personalized deals ranked by value</p>
          </div>
        </div>
        <Link href="/search?q=deal" className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {deals.map((deal) => {
          const disc = discountPercent(deal.mrp, deal.price);
          return (
            <Link
              key={deal.id}
              href={`/product/${deal.slug}`}
              className="w-52 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-white transition hover:shadow-card dark:border-ink-700 dark:bg-ink-800"
            >
              <div className="relative h-36 w-full bg-ink-50 dark:bg-ink-700">
                <Image src={deal.images[0]} alt={deal.title} fill className="object-cover" unoptimized />
                <Badge tone="accent" className="absolute left-2 top-2 text-[10px]">
                  {disc}% off
                </Badge>
                <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-brand-700 shadow-sm">
                  Score: {deal.dealScore}
                </div>
              </div>
              <div className="p-3">
                <p className="text-[10px] text-ink-500">{deal.brand}</p>
                <p className="text-xs font-semibold line-clamp-2">{truncate(deal.title, 50)}</p>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-[11px] font-semibold">{deal.rating.toFixed(1)}</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-sm font-bold text-ink-900 dark:text-white">{formatINR(deal.price)}</span>
                  {deal.mrp > deal.price && (
                    <span className="text-[11px] text-ink-500 line-through">{formatINR(deal.mrp)}</span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Save {formatINR(deal.savings)}
                  </span>
                  <span className="text-[10px] text-accent-600 dark:text-accent-400">{deal.validity}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
