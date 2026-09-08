"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/state/store";
import { formatINR, discountPercent } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { cart, cartTotals, updateCartItem, removeCartItem, applyCoupon } = useStore();
  const [coupon, setCoupon] = useState("");

  if (cart.length === 0) {
    return (
      <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
        <Header />
        <main className="container-page pb-24 pt-4 lg:pb-12">
          <EmptyState icon={<ShoppingCart className="h-8 w-8" />} title="Your cart is empty" description="Looks like you haven't added anything yet." action={<Link href="/" className="btn-base bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">Start shopping</Link>} />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <h1 className="text-xl font-bold mb-4">Shopping Cart ({cartTotals.itemCount} items)</h1>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="card-base flex gap-4 p-4">
                <Link href={`/product/${item.product.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-700">
                  <Image src={item.product.images[0]} alt={item.product.title} fill className="object-cover" unoptimized />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link href={`/product/${item.product.slug}`} className="font-semibold text-sm line-clamp-2 hover:text-brand-600">{item.product.title}</Link>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-bold">{formatINR(item.product.price)}</span>
                    <span className="text-xs text-ink-500 line-through">{formatINR(item.product.mrp)}</span>
                    <span className="text-xs font-bold text-emerald-600">{discountPercent(item.product.mrp, item.product.price)}% off</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartItem(item.id, item.quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-ink-50 dark:bg-ink-700"><Minus className="h-3 w-3" /></button>
                      <span className="min-w-[32px] text-center font-bold">{item.quantity}</span>
                      <button onClick={() => updateCartItem(item.id, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-ink-50 dark:bg-ink-700"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => removeCartItem(item.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-base p-4 self-start sticky top-20">
            <h2 className="mb-3 font-bold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>MRP ({cartTotals.itemCount} items)</span><span>{formatINR(cartTotals.mrpTotal)}</span></div>
              <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatINR(cartTotals.itemDiscount)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{cartTotals.freeDelivery ? <span className="text-emerald-600">FREE</span> : formatINR(cartTotals.deliveryFee)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatINR(cartTotals.tax)}</span></div>
              {cartTotals.couponDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon discount</span><span>-{formatINR(cartTotals.couponDiscount)}</span></div>}
            </div>
            <div className="my-3 h-px bg-ink-200 dark:bg-ink-700" />
            <div className="flex justify-between font-bold"><span>Total</span><span>{formatINR(cartTotals.payable)}</span></div>
            <div className="mt-1 text-xs text-emerald-600 font-medium">You save {formatINR(cartTotals.savings)}</div>

            <div className="mt-4">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" className="input-base mb-2 text-sm" />
              <Button variant="secondary" block onClick={() => applyCoupon(coupon || undefined)}>{cartTotals.couponDiscount > 0 ? "Applied ✓" : "Apply coupon"}</Button>
            </div>

            <Button className="mt-4" block size="lg" onClick={() => router.push("/checkout")}>
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}