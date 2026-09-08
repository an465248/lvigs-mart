"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Timer, Zap } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

export function FlashDeals({ products }: { products: Product[] }) {
  const [hours, setHours] = useState(5);
  const [minutes, setMinutes] = useState(42);
  const [seconds, setSeconds] = useState(18);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s > 0) return s - 1;
        setMinutes((m) => {
          if (m > 0) return m - 1;
          setHours((h) => (h > 0 ? h - 1 : 0));
          return 59;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-white shadow-soft">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Flash Deals</h2>
            <p className="text-xs text-ink-500">Limited time, huge savings</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <Timer className="h-3.5 w-3.5" />
          <span className="font-mono text-sm font-bold tabular-nums">
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
        {products.slice(0, 6).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link href="/search?q=deal" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          See all deals →
        </Link>
      </div>
    </section>
  );
}