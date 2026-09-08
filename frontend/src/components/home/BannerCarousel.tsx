"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BannerWithCTA extends Banner {
  ctaLabel?: string;
  ctaLink?: string;
  ctaText?: string;
  ctaUrl?: string;
  mobileImage?: string;
  sortOrder?: number;
}

export function BannerCarousel({ banners }: { banners: BannerWithCTA[] }) {
  const [idx, setIdx] = useState(0);
  const total = banners.length;

  const next = useCallback(() => {
    if (total <= 1) return;
    setIdx((i) => (i + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    if (total <= 1) return;
    setIdx((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [total, next]);

  if (total === 0) {
    return (
      <div className="skeleton aspect-[3/1] w-full rounded-2xl" />
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      role="region"
      aria-label="Promotional banners"
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {banners.map((b) => {
          const linkHref =
            b.ctaUrl || b.ctaLink || b.link || "#";
          return (
            <Link
              key={b.id}
              href={linkHref}
              className={cn(
                "relative block aspect-[16/7] sm:aspect-[16/5] w-full shrink-0 overflow-hidden bg-gradient-to-r",
                b.bg || "#1a1a2e"
              )}
              style={{
                color: b.fg || "#ffffff",
              }}
            >
              {b.image && (
                <img
                  src={b.image}
                  alt={b.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.18),transparent_60%)]" />
              <div className="relative z-10 flex h-full items-center px-6 sm:px-10">
                <div className="max-w-md">
                  {b.subtitle && (
                    <div className="text-xs sm:text-sm uppercase tracking-widest opacity-80">
                      {b.subtitle}
                    </div>
                  )}
                  <div className="mt-1 text-2xl sm:text-4xl font-extrabold leading-tight">
                    {b.title}
                  </div>
                  {(b.ctaText || b.ctaLabel) && (
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
                      {b.ctaText || b.ctaLabel} →
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow dark:bg-ink-800/85"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow dark:bg-ink-800/85"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
