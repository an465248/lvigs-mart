"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Zap, Truck, ShieldCheck, RotateCcw, Clock4, Tag, Sparkles, Eye, ShoppingCart, Repeat, TrendingUp, Flame } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { FlashDeals } from "@/components/home/FlashDeals";
import { SmartDeals } from "@/components/home/SmartDeals";
import { AssistantWidget } from "@/components/ai/AssistantWidget";
import { mockApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/state/store";

export default function HomePage() {
  const { user, cart } = useStore();
  const [banners, setBanners] = useState<any[]>([]);
  const [flash, setFlash] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [continueShopping, setContinueShopping] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [frequentlyBought, setFrequentlyBought] = useState<Product[]>([]);
  const [personalizedDeals, setPersonalizedDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [b, f, bs, na, rc, tr] = await Promise.all([
        mockApi.getHomeBanners(),
        mockApi.getFlashDeals(),
        mockApi.getBestsellers(),
        mockApi.getNewArrivals(),
        mockApi.getRecommended(),
        mockApi.getTrendingProducts(),
      ]);
      if (!mounted) return;
      setBanners(b);
      setFlash(f);
      setBestsellers(bs);
      setNewArrivals(na);
      setRecommended(rc);
      setTrending(tr);

      if (user && cart.length > 0) {
        const cartProducts = cart.map((c) => c.product);
        const cats = [...new Set(cartProducts.map((p) => p.categoryId))];
        const related = (await Promise.all(cats.map((c) => mockApi.getProductsByCategory(c)))).flat();
        setContinueShopping(related.filter((p) => !cartProducts.find((cp) => cp.id === p.id)).slice(0, 8));
        setFrequentlyBought(related.slice(0, 4));
      }

      try {
        const stored = localStorage.getItem("lvigs.recentlyViewed");
        if (stored) {
          const ids: string[] = JSON.parse(stored);
          const products = await Promise.all(ids.slice(0, 10).map((id) => mockApi.getProduct(id)));
          setRecentlyViewed(products.filter(Boolean) as Product[]);
        }
      } catch {}

      const deals = await mockApi.getDealsOfTheDay();
      setPersonalizedDeals(deals);

      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user, cart]);

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <BannerCarousel banners={banners} />

        <CategoryGrid />

        <BenefitsStrip />

        {flash.length > 0 && <FlashDeals products={flash} />}

        {continueShopping.length > 0 && (
          <Section
            title="Continue Shopping"
            subtitle="Pick up where you left off"
            icon={<Repeat className="h-4 w-4" />}
          >
            <ProductGrid products={continueShopping} />
          </Section>
        )}

        {recentlyViewed.length > 0 && (
          <Section
            title="Recently Viewed"
            subtitle="Your recently viewed products"
            cta={{ href: "/profile", label: "View all" }}
            icon={<Eye className="h-4 w-4" />}
          >
            <ProductGrid products={recentlyViewed} />
          </Section>
        )}

        <Section
          title="Best Sellers"
          subtitle="Top picks loved by LVIGS customers"
          cta={{ href: "/category/electronics", label: "View all" }}
          icon={<Tag className="h-4 w-4" />}
        >
          {loading ? <GridSkeleton /> : <ProductGrid products={bestsellers} />}
        </Section>

        <SmartDeals />

        <Section
          title="New Arrivals"
          subtitle="Freshly added, only on LVIGS Mart"
          cta={{ href: "/search?q=new", label: "View all" }}
          icon={<Zap className="h-4 w-4" />}
        >
          {loading ? <GridSkeleton /> : <ProductGrid products={newArrivals} />}
        </Section>

        <PromoBanner />

        {frequentlyBought.length > 0 && (
          <Section
            title="Frequently Bought Together"
            subtitle="Complete your purchase"
            icon={<ShoppingCart className="h-4 w-4" />}
          >
            <ProductGrid products={frequentlyBought} />
          </Section>
        )}

        <Section
          title="Trending Now"
          subtitle="What everyone is shopping right now"
          cta={{ href: "/category/fashion", label: "View all" }}
          icon={<Clock4 className="h-4 w-4" />}
        >
          {loading ? <GridSkeleton /> : <ProductGrid products={trending} />}
        </Section>

        <Section
          title="Recommended For You"
          subtitle="Personalised picks based on your activity"
          cta={{ href: "/profile", label: "Personalise" }}
        >
          {loading ? <GridSkeleton /> : <ProductGrid products={recommended} />}
        </Section>

        {personalizedDeals.length > 0 && (
          <Section
            title="Personalized Deals"
            subtitle="Deals matching your interests"
            icon={<Flame className="h-4 w-4" />}
          >
            <ProductGrid products={personalizedDeals} />
          </Section>
        )}

        <AssistantBanner />
      </main>
      <Footer />
      <BottomNav />
      <AssistantWidget />
    </div>
  );
}

function Section({
  title,
  subtitle,
  cta,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  cta?: { href: string; label: string };
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-ink-900 dark:text-white">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
        </div>
        {cta && (
          <Link href={cta.href} className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
            {cta.label} <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

function BenefitsStrip() {
  const items = [
    { icon: Truck, label: "Free delivery" },
    { icon: ShieldCheck, label: "Secure payments" },
    { icon: RotateCcw, label: "Easy returns" },
    { icon: Clock4, label: "24×7 support" },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-700 dark:bg-ink-800 sm:grid-cols-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function PromoBanner() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white">
        <div className="text-xs uppercase tracking-wide opacity-80">New user offer</div>
        <div className="mt-1 text-2xl font-extrabold">Flat 10% off</div>
        <div className="text-sm opacity-80">Use code WELCOME10</div>
        <Link href="/search" className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur hover:bg-white/25">
          Shop now →
        </Link>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 p-5 text-white">
        <div className="text-xs uppercase tracking-wide opacity-80">Festive sale</div>
        <div className="mt-1 text-2xl font-extrabold">Up to 60% off</div>
        <div className="text-sm opacity-80">Electronics & fashion</div>
        <Link href="/category/electronics" className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur hover:bg-white/25">
          Explore →
        </Link>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 p-5 text-white">
        <div className="text-xs uppercase tracking-wide opacity-80">Grocery in 30 min</div>
        <div className="mt-1 text-2xl font-extrabold">Free delivery</div>
        <div className="text-sm opacity-80">On your first 3 orders</div>
        <Link href="/category/grocery" className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur hover:bg-white/25">
          Start shopping →
        </Link>
      </div>
    </div>
  );
}

function AssistantBanner() {
  return (
    <Link href="/assistant" className="mt-8 block rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-brand-100 p-5 transition hover:shadow-card dark:border-brand-800 dark:from-brand-950/30 dark:to-brand-950/50">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-ink-900 dark:text-white">Need help? Ask our AI assistant</h3>
          <p className="text-sm text-ink-500 dark:text-ink-400">Find products, compare prices, get recommendations</p>
        </div>
        <ChevronRight className="h-5 w-5 text-brand-600" />
      </div>
    </Link>
  );
}