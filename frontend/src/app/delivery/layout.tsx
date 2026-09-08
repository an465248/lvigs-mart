"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Truck, MapPin, Settings, Menu, X, LogOut, ChevronRight, Package, Loader2
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const DELIVERY_AUTH_KEY = "lvigs_delivery_auth";

function isDeliveryLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DELIVERY_AUTH_KEY) === "true";
}

function deliveryLogout() {
  localStorage.removeItem(DELIVERY_AUTH_KEY);
}

const nav = [
  { href: "/delivery/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/delivery/deliveries", label: "My Deliveries", icon: Truck },
  { href: "/delivery/available", label: "Available", icon: Package },
  { href: "/delivery/settings", label: "Settings", icon: Settings },
];

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const isPublicPage = pathname === "/delivery/login" || pathname === "/delivery/register";

  useEffect(() => {
    if (isPublicPage) { setAuthed(true); return; }
    setAuthed(isDeliveryLoggedIn());
  }, [pathname, isPublicPage]);

  useEffect(() => {
    if (authed === false && !isPublicPage) router.replace("/delivery/login");
  }, [authed, isPublicPage, router]);

  const handleLogout = () => { deliveryLogout(); router.push("/delivery/login"); };

  if (isPublicPage) return <>{children}</>;

  if (authed === null || authed === false) {
    return <div className="flex min-h-dvh items-center justify-center bg-ink-50 dark:bg-ink-900"><Loader2 className="h-8 w-8 animate-spin text-accent-600" /></div>;
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-screen bg-ink-50 dark:bg-ink-900">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-ink-200 dark:bg-ink-800 dark:border-ink-700 transition-transform duration-200",
        "lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-2 border-b border-ink-200 dark:border-ink-700 px-5">
          <Logo variant="mark" className="h-8 w-8" />
          <div>
            <p className="text-sm font-bold leading-tight">LVIGS Mart</p>
            <p className="text-[10px] text-ink-500">Delivery Partner</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden"><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300" : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"
                )}>
                <Icon className="h-5 w-5 shrink-0" />{item.label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-ink-200 dark:border-ink-700 p-4 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-sm text-ink-500 hover:text-accent-600 transition"><MapPin className="h-4 w-4" />Back to Store</Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 text-sm text-ink-500 hover:text-rose-600 transition"><LogOut className="h-4 w-4" />Logout</button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-ink-200 bg-white px-4 dark:border-ink-700 dark:bg-ink-800 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="h-6 w-6 text-ink-600" /></button>
          <h1 className="text-lg font-bold">Delivery Partner</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">D</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
