"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { mockApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Search, TrendingUp } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<string[]>([]);

  useEffect(() => {
    mockApi.getTrendingSearches().then(setTrending);
  }, []);

  useEffect(() => {
    setQuery(q);
    if (q) {
      setLoading(true);
      mockApi.searchProducts(q).then((p) => { setResults(p); setLoading(false); });
    }
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    mockApi.addRecentSearch(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        {!q ? (
          <div className="mx-auto max-w-xl text-center">
            <div className="mb-6 rounded-2xl bg-white p-8 shadow-soft dark:bg-ink-800">
              <Search className="mx-auto mb-4 h-12 w-12 text-brand-500" />
              <h1 className="text-xl font-bold">What are you looking for?</h1>
              <p className="mt-1 text-sm text-ink-500">Search across millions of products</p>
              <form onSubmit={handleSearch} className="mt-4">
                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products, brands, categories"
                    className="input-base flex-1"
                    autoFocus
                  />
                  <button type="submit" className="btn-base bg-brand-600 px-4 text-white hover:bg-brand-700">Search</button>
                </div>
              </form>
            </div>
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-200"><TrendingUp className="mr-1 inline h-4 w-4" /> Trending</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {trending.map((t) => (
                  <button key={t} onClick={() => router.push(`/search?q=${encodeURIComponent(t)}`)} className="rounded-full bg-white px-3 py-1.5 text-sm shadow-soft hover:bg-brand-50 dark:bg-ink-800">{t}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="mb-4 text-lg font-bold">
              {loading ? "Searching..." : `${results.length} results for "${q}"`}
            </h2>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : results.length === 0 ? (
              <div className="py-20 text-center text-ink-500">No products found for "{q}". Try a different search.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {results.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}