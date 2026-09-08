"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { useStore } from "@/state/store";
import { useToast } from "@/components/ui/Toast";
import { mockApi } from "@/lib/api";
import { formatINR, discountPercent, cn } from "@/lib/utils";
import type { Product, Review } from "@/lib/types";
import { Heart, ShoppingCart, Zap, Star, Truck, Shield, RotateCcw, ChevronRight, Minus, Plus, ChevronDown, ChevronUp, Bell, BellOff, TrendingDown, TrendingUp, Target } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [showSpecs, setShowSpecs] = useState(false);
  const [showDesc, setShowDesc] = useState(true);
  const [pincode, setPincode] = useState("");
  const [priceAlertOpen, setPriceAlertOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [hasPriceAlert, setHasPriceAlert] = useState(false);
  const [hasStockAlert, setHasStockAlert] = useState(false);

  useEffect(() => {
    setLoading(true);
    mockApi.getProduct(slug).then((p) => {
      if (p) {
        setProduct(p);
        mockApi.getReviews(p.id).then(setReviews);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="flex min-h-dvh items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
  if (!product) return <div className="flex min-h-dvh items-center justify-center text-ink-500">Product not found</div>;

  const disc = discountPercent(product.mrp, product.price);
  const wished = isWishlisted(product.id);

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <nav className="mb-4 text-xs text-ink-500">
          <Link href="/" className="hover:text-brand-600">Home</Link><span className="mx-1">/</span>
          <Link href={`/category/${product.categoryId}`} className="hover:text-brand-600">{product.categoryId}</Link><span className="mx-1">/</span>
          <span className="font-medium text-ink-900 dark:text-white line-clamp-1">{product.title}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_480px]">
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white dark:bg-ink-800">
              <Image src={product.images[imgIdx] || product.images[0]} alt={product.title} fill className="object-contain p-4" unoptimized />
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {disc > 0 && <Badge tone="accent">{disc}% off</Badge>}
                {product.isBestseller && <Badge tone="brand">Bestseller</Badge>}
              </div>
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={cn("shrink-0 rounded-lg border-2 overflow-hidden", i === imgIdx ? "border-brand-500" : "border-transparent")}>
                    <Image src={img} alt="" width={64} height={64} className="h-16 w-16 object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-ink-500">{product.brand}</p>
              <h1 className="text-xl font-bold leading-tight">{product.title}</h1>
              <div className="mt-2 flex items-center gap-2">
                <span className="flex items-center gap-0.5 rounded bg-emerald-600 px-2 py-0.5 text-sm font-bold text-white">
                  {product.rating.toFixed(1)} <Star className="h-3.5 w-3.5 fill-current" />
                </span>
                <span className="text-sm text-ink-500">{product.ratingCount.toLocaleString("en-IN")} ratings</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold">{formatINR(product.price)}</span>
              {product.mrp > product.price && <span className="text-lg text-ink-500 line-through">{formatINR(product.mrp)}</span>}
              {disc > 0 && <span className="text-lg font-bold text-emerald-600">{disc}% off</span>}
            </div>

            <div className="flex flex-wrap gap-2">
              {product.fastDelivery && <Badge tone="success"><Truck className="h-3 w-3" /> Fast delivery</Badge>}
              <Badge tone="muted"><RotateCcw className="h-3 w-3" /> {product.returnPolicy || "7 day returns"}</Badge>
              {product.warranty && <Badge tone="muted"><Shield className="h-3 w-3" /> {product.warranty}</Badge>}
            </div>

            <div className="rounded-xl border bg-white p-3 dark:border-ink-700 dark:bg-ink-800">
              <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">Delivery to</p>
              <div className="mt-2 flex gap-2">
                <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Enter pincode" className="input-base flex-1 text-sm" maxLength={6} />
                <Button size="sm" variant="secondary">Check</Button>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-3 dark:border-ink-700 dark:bg-ink-800">
              <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">Quantity</p>
              <div className="mt-2 flex items-center gap-3">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-ink-50 dark:bg-ink-700"><Minus className="h-4 w-4" /></button>
                <span className="min-w-[40px] text-center text-lg font-bold">{qty}</span>
                <button onClick={() => setQty(Math.min(10, qty + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-ink-50 dark:bg-ink-700"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" size="lg" onClick={() => { addToCart(product.id, qty); toast.push("Added to cart!", "success"); }}>
                <ShoppingCart className="h-5 w-5" /> Add to Cart
              </Button>
              <Button className="flex-1" size="lg" variant="accent" onClick={() => { addToCart(product.id, qty); router.push("/checkout"); }}>
                <Zap className="h-5 w-5" /> Buy Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => { toggleWishlist(product.id); toast.push(wished ? "Removed from wishlist" : "Added to wishlist", "success"); }}>
                <Heart className={cn("h-5 w-5", wished && "fill-rose-500 text-rose-500")} />
              </Button>
            </div>

            {product.emi && product.emi.length > 0 && (
              <div className="rounded-xl border bg-white p-3 dark:border-ink-700 dark:bg-ink-800">
                <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">EMI starts at</p>
                {product.emi.map((e, i) => (
                  <p key={i} className="mt-1 text-sm">{formatINR(e.monthly)}/month × {e.tenureMonths} months</p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <button onClick={() => setShowSpecs(!showSpecs)} className="flex w-full items-center justify-between rounded-xl border bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
            <h2 className="text-lg font-bold">Specifications</h2>
            {showSpecs ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {showSpecs && (
            <div className="rounded-xl border bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
              <table className="w-full text-sm">
                <tbody>
                  {product.specifications.map((s, i) => (
                    <tr key={i} className="border-b last:border-0 dark:border-ink-700">
                      <td className="py-2 pr-4 text-ink-500">{s.label}</td>
                      <td className="py-2 font-medium">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button onClick={() => setShowDesc(!showDesc)} className="flex w-full items-center justify-between rounded-xl border bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
            <h2 className="text-lg font-bold">Description</h2>
            {showDesc ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {showDesc && (
            <div className="rounded-xl border bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
              <p className="text-sm text-ink-700 dark:text-ink-200 whitespace-pre-line">{product.description}</p>
              {product.highlights.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {product.highlights.map((h, i) => <li key={i} className="flex gap-2"><span className="text-brand-500">✓</span> {h}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="rounded-xl border bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
            <h2 className="mb-3 text-lg font-bold">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-ink-500">No reviews yet. Be the first to review this product.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b pb-3 last:border-0 dark:border-ink-700">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-bold text-white">{r.rating} <Star className="h-2.5 w-2.5 fill-current" /></span>
                      <span className="font-semibold text-sm">{r.title}</span>
                      {r.verified && <Badge tone="success" className="text-[10px]">Verified</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">{r.body}</p>
                    <p className="mt-1 text-xs text-ink-500">by {r.userName} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {product.stock > 0 && (
            <div className="rounded-xl border bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                    <Target className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Set Price Alert</h3>
                    <p className="text-xs text-ink-500">Get notified when price drops</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={hasPriceAlert ? "secondary" : "outline"}
                  onClick={() => {
                    if (hasPriceAlert) {
                      setHasPriceAlert(false);
                      toast.push("Price alert removed", "info");
                    } else {
                      setPriceAlertOpen(true);
                    }
                  }}
                >
                  {hasPriceAlert ? <><BellOff className="h-3 w-3" /> Alert Set</> : <><Bell className="h-3 w-3" /> Set Alert</>}
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-50 p-3 dark:bg-ink-700">
                <div className="flex-1">
                  <p className="text-xs text-ink-500">Price Trend</p>
                  <div className="mt-1 flex items-end gap-0.5 h-8">
                    {[40, 45, 38, 50, 42, 55, 48, 52, 46, 50].map((h, i) => (
                      <div key={i} className="w-3 rounded-t bg-brand-200 dark:bg-brand-800" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  {product.price < product.mrp * 0.8 ? (
                    <Badge tone="success"><TrendingDown className="h-3 w-3" /> Good time to buy</Badge>
                  ) : (
                    <Badge tone="warning"><TrendingUp className="h-3 w-3" /> Price may drop</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {product.stock === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    <Bell className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Out of Stock</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {hasStockAlert ? "You'll be notified when back in stock" : "Get notified when available"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={hasStockAlert ? "secondary" : "accent"}
                  onClick={() => {
                    setHasStockAlert(!hasStockAlert);
                    toast.push(hasStockAlert ? "Stock alert removed" : "Subscribed to stock alert!", "success");
                  }}
                >
                  {hasStockAlert ? <><BellOff className="h-3 w-3" /> Subscribed</> : <><Bell className="h-3 w-3" /> Notify Me</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {priceAlertOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setPriceAlertOpen(false)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-pop dark:bg-ink-800 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Set Price Alert</h3>
            <p className="mt-1 text-sm text-ink-500">
              Current price: <span className="font-semibold text-ink-900 dark:text-white">{formatINR(product.price)}</span>
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">Target Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">₹</span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Enter target price"
                  className="input-base pl-8"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setPriceAlertOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (targetPrice && Number(targetPrice) > 0) {
                    setHasPriceAlert(true);
                    setPriceAlertOpen(false);
                    toast.push(`Price alert set for ${formatINR(Number(targetPrice))}`, "success");
                  }
                }}
              >
                Set Alert
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}