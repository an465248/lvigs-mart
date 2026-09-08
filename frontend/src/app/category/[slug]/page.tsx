"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { mockApi } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import Link from "next/link";
import { ChevronDown, Grid3x3, List, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      mockApi.getCategory(slug),
      mockApi.getProductsByCategory(slug),
    ]).then(([cat, prods]) => {
      setCategory(cat || null);
      setProducts(prods);
      setLoading(false);
    });
  }, [slug]);

  const sorted = [...products].sort((a, b) => {
    switch (sort) {
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "rating": return b.rating - a.rating;
      case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default: return 0;
    }
  });

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <nav className="mb-3 text-xs text-ink-500">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <span className="mx-1">/</span>
          <span className="font-semibold text-ink-900 dark:text-white">{category?.name || slug}</span>
        </nav>

        {category?.subcategories && category.subcategories.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {category.subcategories.map((sub) => (
              <Link key={sub.id} href={`/category/${sub.slug}`} className="shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs font-medium hover:bg-brand-50 dark:border-ink-700 dark:bg-ink-800">
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">{category?.name || "Products"}</h1>
          <div className="flex items-center gap-2">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-base h-9 w-auto text-xs">
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating</option>
              <option value="newest">Newest</option>
            </select>
            <button onClick={() => setView("grid")} className={cn("rounded p-1.5", view === "grid" ? "bg-brand-100 text-brand-600" : "text-ink-400")}>
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("rounded p-1.5", view === "list" ? "bg-brand-100 text-brand-600" : "text-ink-400")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className={view === "grid" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-3"}>
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-20 text-center text-ink-500">No products found in this category.</div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-3"}>
            {sorted.map((p) => (
              <ProductCard key={p.id} product={p} layout={view} />
            ))}
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}