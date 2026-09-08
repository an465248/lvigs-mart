"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Heart } from "lucide-react";
import { mockApi } from "@/lib/api";
import type { WishlistItem } from "@/lib/types";
import Link from "next/link";

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  useEffect(() => { setItems(mockApi.getWishlist()); }, []);
  useEffect(() => {
    const handler = () => setItems(mockApi.getWishlist());
    window.addEventListener("lvigs:wishlist-change", handler);
    return () => window.removeEventListener("lvigs:wishlist-change", handler);
  }, []);

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <h1 className="text-xl font-bold mb-4">My Wishlist ({items.length})</h1>
        {items.length === 0 ? (
          <EmptyState icon={<Heart className="h-8 w-8" />} title="Your wishlist is empty" description="Save items you love for later." action={<Link href="/" className="btn-base bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">Discover products</Link>} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((w) => <ProductCard key={w.id} product={w.product} />)}
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}