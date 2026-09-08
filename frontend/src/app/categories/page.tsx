"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { mockApi } from "@/lib/api";
import { Smartphone, Cpu, Shirt, Apple, Sparkles, Sofa, WashingMachine, Dumbbell, Book, Blocks, Car, Watch } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = { Smartphone, Cpu, Shirt, Apple, Sparkles, Sofa, WashingMachine, Dumbbell, Book, Blocks, Car, Watch };

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => { mockApi.getCategories().then(setCats); }, []);

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <h1 className="text-xl font-bold mb-4">All Categories</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {cats.map((c) => {
            const Icon = iconMap[c.icon || "Smartphone"];
            return (
              <Link key={c.id} href={`/category/${c.slug}`} className="card-base flex flex-col items-center gap-3 p-6 text-center transition hover:shadow-card">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                  {Icon && <Icon className="h-8 w-8" />}
                </div>
                <span className="font-semibold">{c.name}</span>
                {c.subcategories && <span className="text-xs text-ink-500">{c.subcategories.length} subcategories</span>}
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}