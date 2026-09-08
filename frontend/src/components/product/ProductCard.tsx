"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Zap, Star } from "lucide-react";
import { useStore } from "@/state/store";
import { useToast } from "@/components/ui/Toast";
import { discountPercent, formatINR, truncate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  layout?: "grid" | "list";
}

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const toast = useToast();
  const [imgIdx, setImgIdx] = useState(0);
  const wished = isWishlisted(product.id);
  const disc = discountPercent(product.mrp, product.price);

  if (layout === "list") {
    return (
      <Link href={`/product/${product.slug}`} className="card-base flex overflow-hidden transition hover:shadow-card">
        <div className="relative h-40 w-40 shrink-0 bg-ink-50 dark:bg-ink-700">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="160px"
            className="object-cover"
            unoptimized
          />
          {disc > 0 && (
            <Badge tone="accent" className="absolute left-2 top-2">{disc}% off</Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span>({product.ratingCount})</span>
            <span className="ml-2 truncate">• {product.brand}</span>
          </div>
          <h3 className="mt-1 text-sm font-semibold line-clamp-2">{product.title}</h3>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400 line-clamp-1">{product.highlights[0]}</p>
          <div className="mt-auto flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold">{formatINR(product.price)}</span>
                {product.mrp > product.price && (
                  <span className="text-xs text-ink-500 line-through">{formatINR(product.mrp)}</span>
                )}
              </div>
              {product.fastDelivery && (
                <Badge tone="success" className="mt-1">
                  <Zap className="h-3 w-3" /> Fast delivery
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist(product.id);
                  toast.push(wished ? "Removed from wishlist" : "Added to wishlist", "success");
                }}
                className={cn(
                  "rounded-lg border p-2 transition",
                  wished
                    ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                )}
                aria-label="Toggle wishlist"
              >
                <Heart className={cn("h-4 w-4", wished && "fill-current")} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(product.id);
                  toast.push("Added to cart", "success");
                }}
                className="btn-base h-9 px-3 bg-brand-600 text-white hover:bg-brand-700"
              >
                <ShoppingCart className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="card-base group flex flex-col overflow-hidden transition hover:shadow-card">
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-square w-full overflow-hidden bg-ink-50 dark:bg-ink-700"
        onMouseEnter={() => product.images[1] && setImgIdx(1)}
        onMouseLeave={() => setImgIdx(0)}
      >
        <Image
          src={product.images[imgIdx] || product.images[0]}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {disc > 0 && <Badge tone="accent">{disc}% off</Badge>}
          {product.isBestseller && <Badge tone="brand">Bestseller</Badge>}
          {product.isFlashDeal && <Badge tone="danger">Flash Deal</Badge>}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
            toast.push(wished ? "Removed from wishlist" : "Added to wishlist", "success");
          }}
          className={cn(
            "absolute right-2 top-2 rounded-full bg-white/95 p-2 shadow-sm transition dark:bg-ink-800/95",
            wished ? "text-rose-600" : "text-slate-600 hover:scale-110 dark:text-slate-300"
          )}
          aria-label="Toggle wishlist"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-current")} />
        </button>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <div className="text-[11px] uppercase tracking-wide text-ink-500 dark:text-ink-400">{product.brand}</div>
        <Link href={`/product/${product.slug}`} className="mt-0.5 text-sm font-semibold leading-snug line-clamp-2 hover:text-brand-600 dark:hover:text-brand-300">
          {truncate(product.title, 70)}
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span className="flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {product.rating.toFixed(1)} <Star className="h-2.5 w-2.5 fill-current" />
          </span>
          <span className="text-ink-500 dark:text-ink-400">({product.ratingCount.toLocaleString("en-IN")})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-ink-900 dark:text-white">{formatINR(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-ink-500 line-through">{formatINR(product.mrp)}</span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
          {product.freeDelivery ? "Free delivery" : `+ ${formatINR(product.deliveryCharge)} delivery`}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              addToCart(product.id);
              toast.push("Added to cart", "success");
            }}
            className="btn-base h-9 flex-1 bg-brand-600 text-white hover:bg-brand-700"
          >
            <ShoppingCart className="h-4 w-4" /> Add
          </button>
          <Link
            href={`/checkout?productId=${product.id}`}
            className="btn-base h-9 flex-1 bg-accent-500 text-white hover:bg-accent-600"
          >
            <Zap className="h-4 w-4" /> Buy
          </Link>
        </div>
      </div>
    </div>
  );
}