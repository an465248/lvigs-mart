"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Smartphone, Cpu, Shirt, Apple, Sparkles, Sofa, WashingMachine, Dumbbell, Book, Blocks, Car, Watch, ChevronRight } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { mockApi } from "@/lib/api";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Smartphone, Cpu, Shirt, Apple, Sparkles, Sofa, WashingMachine, Dumbbell, Book, Blocks, Car, Watch,
};

const DEFAULT_CATS: Category[] = [
  { id: "cat-mob", slug: "mobiles", name: "Mobiles", icon: "Smartphone", order: 1 },
  { id: "cat-elec", slug: "electronics", name: "Electronics", icon: "Cpu", order: 2 },
  { id: "cat-fash", slug: "fashion", name: "Fashion", icon: "Shirt", order: 3 },
  { id: "cat-groc", slug: "grocery", name: "Grocery", icon: "Apple", order: 4 },
  { id: "cat-beau", slug: "beauty", name: "Beauty", icon: "Sparkles", order: 5 },
  { id: "cat-home", slug: "home-furniture", name: "Home", icon: "Sofa", order: 6 },
  { id: "cat-app", slug: "appliances", name: "Appliances", icon: "WashingMachine", order: 7 },
  { id: "cat-sport", slug: "sports", name: "Sports", icon: "Dumbbell", order: 8 },
  { id: "cat-books", slug: "books", name: "Books", icon: "Book", order: 9 },
  { id: "cat-toys", slug: "toys", name: "Toys", icon: "Blocks", order: 10 },
  { id: "cat-auto", slug: "automotive", name: "Auto", icon: "Car", order: 11 },
  { id: "cat-acc", slug: "accessories", name: "Accessories", icon: "Watch", order: 12 },
];

export function CategoryGrid() {
  const [cats, setCats] = useState<Category[]>(DEFAULT_CATS);

  useEffect(() => {
    mockApi.getCategories().then((data) => {
      if (data && data.length > 0) {
        setCats(data.map((c: any, i: number) => ({
          id: c.id || `cat-${i}`,
          slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, "-") || "",
          name: c.name || "",
          icon: c.icon || DEFAULT_CATS[i % DEFAULT_CATS.length]?.icon || "Smartphone",
          order: c.order || i + 1,
        })));
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="mt-4 rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-700 dark:bg-ink-800">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold">Shop by Category</h2>
        <Link href="/categories" className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700">
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {cats.map((c) => {
          const Icon = iconMap[c.icon || "Smartphone"];
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition",
                "hover:bg-brand-50 dark:hover:bg-brand-950/30"
              )}
            >
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100 transition group-hover:scale-105 dark:from-brand-950/40 dark:to-brand-950/10 dark:text-brand-300 dark:ring-brand-900/40">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium leading-tight">{c.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}