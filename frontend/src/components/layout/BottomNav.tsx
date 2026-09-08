"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, Search as SearchIcon, ShoppingCart, User, Sparkles, Award } from "lucide-react";
import { useStore } from "@/state/store";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount, user } = useStore();

  const ITEMS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/categories", label: "Categories", icon: Grid3x3 },
    { href: "/assistant", label: "Assistant", icon: Sparkles },
    { href: "/cart", label: "Cart", icon: ShoppingCart, showCount: true },
    { href: "/profile", label: "Account", icon: User },
  ];

  if (user) {
    ITEMS.splice(3, 0, { href: "/loyalty", label: "Loyalty", icon: Award });
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-ink-100 bg-white/95 backdrop-blur safe-bottom dark:border-ink-700 dark:bg-ink-900/95">
      <div className={cn("grid", user ? "grid-cols-6" : "grid-cols-5")}>
        {ITEMS.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition",
                active ? "text-brand-600 dark:text-brand-300" : "text-ink-500 dark:text-ink-400"
              )}
            >
              <Icon className="h-5 w-5" />
              {it.showCount && cartCount > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-3 -translate-y-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
              <span>{it.label}</span>
              {active && <span className="absolute -bottom-px h-0.5 w-8 rounded-full bg-brand-600 dark:bg-brand-300" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}