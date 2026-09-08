"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search, MapPin, ShoppingCart, Heart, User, Menu, Mic, X, Bell,
  ChevronDown, Headphones, Package, LogOut, Settings, Moon, Sun, ScanBarcode,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/state/store";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { VoiceSearch } from "@/components/search/VoiceSearch";
import { ImageSearch } from "@/components/search/ImageSearch";
import { BarcodeSearch } from "@/components/search/BarcodeSearch";
import { searchByBarcode } from "@/lib/api-phase6";

const NAV_LINKS = [
  { href: "/category/electronics", label: "Electronics" },
  { href: "/category/fashion", label: "Fashion" },
  { href: "/category/grocery", label: "Grocery" },
  { href: "/category/home-furniture", label: "Home" },
  { href: "/category/beauty", label: "Beauty" },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { cartCount, wishlistCount, notifUnreadCount, user, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled ? "bg-white/85 dark:bg-ink-900/90 backdrop-blur-lg shadow-soft" : "bg-white dark:bg-ink-900"
      )}
    >
      <div className="container-page flex items-center gap-3 py-3">
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="ml-2 hidden md:flex">
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800">
            <MapPin className="h-4 w-4 text-brand-600" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wide text-ink-500">Deliver to</div>
              <div className="font-semibold">Bengaluru 560001</div>
            </div>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            if (!q) return;
            router.push(`/search?q=${encodeURIComponent(q)}`);
            setSearchOpen(false);
          }}
          className="relative flex-1 max-w-2xl"
        >
          <div className="flex h-11 items-center rounded-xl border bg-ink-50 pl-3 pr-1 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:bg-ink-800">
            <Search className="h-5 w-5 text-ink-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              type="search"
              placeholder="Search for products, brands and more"
              className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-ink-400"
              aria-label="Search"
            />
            <VoiceSearch
              onResult={(text) => {
                setQuery(text);
                router.push(`/search?q=${encodeURIComponent(text)}`);
                setSearchOpen(false);
              }}
            />
            <ImageSearch
              onResult={(url) => {
                router.push(`/search?q=${encodeURIComponent("image search")}`);
                setSearchOpen(false);
              }}
            />
            <BarcodeSearch
              onResult={async (code) => {
                try {
                  const result = await searchByBarcode(code);
                  if (result.found && result.product) {
                    router.push(`/product/${result.product.slug}`);
                  } else {
                    router.push(`/search?q=${encodeURIComponent(code)}`);
                  }
                } catch {
                  router.push(`/search?q=${encodeURIComponent(code)}`);
                }
                setSearchOpen(false);
              }}
            />
          </div>
          {searchOpen && (
            <SearchPanel
              query={query}
              onClose={() => setSearchOpen(false)}
              onPick={(q) => {
                setQuery(q);
                router.push(`/search?q=${encodeURIComponent(q)}`);
                setSearchOpen(false);
              }}
            />
          )}
        </form>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link
            href="/notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifUnreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {notifUnreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/wishlist"
            className="relative hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen((o) => !o)}
              className="ml-1 hidden sm:inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-ink-800 hover:bg-ink-100 dark:text-ink-100 dark:hover:bg-ink-800"
            >
              <User className="h-5 w-5" />
              <span className="hidden md:inline">{user ? "Account" : "Login"}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {accountOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-white p-2 shadow-pop dark:border-ink-700 dark:bg-ink-800">
                {user ? (
                  <>
                    <div className="px-3 py-2">
                      <div className="text-xs text-ink-500">Signed in as</div>
                      <div className="font-semibold">{user.name || user.mobile}</div>
                    </div>
                    <div className="h-px bg-ink-100 dark:bg-ink-700" />
                    <AccountLink href="/profile" icon={<User className="h-4 w-4" />}>Profile</AccountLink>
                    <AccountLink href="/orders" icon={<Package className="h-4 w-4" />}>My Orders</AccountLink>
                    <AccountLink href="/wishlist" icon={<Heart className="h-4 w-4" />}>Wishlist</AccountLink>
                    <AccountLink href="/help" icon={<Headphones className="h-4 w-4" />}>Help Center</AccountLink>
                    <AccountLink href="/settings" icon={<Settings className="h-4 w-4" />}>Settings</AccountLink>
                    <button
                      onClick={() => { logout(); setAccountOpen(false); router.push("/"); }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2">
                      <div className="font-semibold">Welcome to LVIGS Mart</div>
                      <div className="text-xs text-ink-500">Sign in to access orders, wishlist and offers.</div>
                    </div>
                    <Button onClick={() => { setAccountOpen(false); router.push("/auth/login"); }} block>Login / Sign up</Button>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-ink-500">
                      <Link href="/orders" className="rounded px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-700">My Orders</Link>
                      <Link href="/wishlist" className="rounded px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-700">Wishlist</Link>
                      <Link href="/help" className="rounded px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-700">Help</Link>
                      <Link href="/settings" className="rounded px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-700">Settings</Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="hidden lg:block border-t border-ink-100 dark:border-ink-800">
        <div className="container-page flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800",
                pathname.startsWith(l.href) && "bg-ink-100 dark:bg-ink-800 text-brand-700 dark:text-brand-300"
              )}
            >
              {l.label}
            </Link>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 dark:bg-accent-950/30 dark:text-accent-300">
            🔥 Festive Sale Live
          </span>
        </div>
      </nav>

      {menuOpen && (
        <SideMenu
          onClose={() => setMenuOpen(false)}
          user={user}
          onLogout={() => { logout(); router.push("/"); }}
        />
      )}
    </header>
  );
}

function AccountLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-ink-50 dark:hover:bg-ink-700">
      {icon} {children}
    </Link>
  );
}

function SideMenu({ onClose, user, onLogout }: { onClose: () => void; user: ReturnType<typeof useStore>["user"]; onLogout: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-0 h-full w-72 max-w-[80%] overflow-y-auto bg-white p-4 dark:bg-ink-900 animate-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <Logo variant="compact" />
          <button onClick={onClose} className="rounded-md p-2 hover:bg-ink-100 dark:hover:bg-ink-800"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-3 rounded-xl bg-brand-50 p-3 dark:bg-brand-950/30">
          <div className="text-sm">{user ? `Hi, ${user.name || user.mobile}` : "Welcome guest"}</div>
          {user ? (
            <button onClick={onLogout} className="mt-2 text-xs font-semibold text-rose-600">Logout</button>
          ) : (
            <Link href="/auth/login" className="mt-2 inline-block text-xs font-semibold text-brand-700 dark:text-brand-300">Login / Sign up →</Link>
          )}
        </div>
        <div className="grid gap-1 text-sm">
          <Link href="/" onClick={onClose} className="rounded-md px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800">Home</Link>
          <Link href="/orders" onClick={onClose} className="rounded-md px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800">My Orders</Link>
          <Link href="/wishlist" onClick={onClose} className="rounded-md px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800">Wishlist</Link>
          <Link href="/cart" onClick={onClose} className="rounded-md px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800">Cart</Link>
          <Link href="/notifications" onClick={onClose} className="rounded-md px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800">Notifications</Link>
          <Link href="/help" onClick={onClose} className="rounded-md px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800">Help Center</Link>
          <Link href="/settings" onClick={onClose} className="rounded-md px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800">Settings</Link>
        </div>
        <div className="mt-6 rounded-xl bg-ink-50 p-3 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
          <div className="font-semibold text-ink-700 dark:text-ink-200">{BRAND.name}</div>
          <div>{BRAND.tagline}</div>
        </div>
      </div>
    </div>
  );
}

import { SearchPanel } from "./SearchPanel";