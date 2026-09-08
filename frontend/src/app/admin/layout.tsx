"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Ticket, Users,
  Store, Menu, X, LogOut, ChevronRight, Loader2, CreditCard, Image, FileText, Headphones, ClipboardList
} from "lucide-react";
import { isAdminLoggedIn, adminLogout } from "@/lib/admin-auth";
import { Logo } from "@/components/brand/Logo";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/sellers", label: "Sellers", icon: Store },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/commissions", label: "Commissions", icon: CreditCard },
  { href: "/admin/banners", label: "Banners & Offers", icon: Image },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) { setAuthed(true); return; }
    setAuthed(isAdminLoggedIn());
  }, [pathname, isLoginPage]);

  useEffect(() => {
    if (authed === false && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [authed, isLoginPage, router]);

  const handleLogout = () => {
    adminLogout();
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (authed === null || authed === false) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink-50 dark:bg-ink-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-ink-50 dark:bg-ink-900">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-ink-200 dark:bg-ink-800 dark:border-ink-700 transition-transform duration-200",
        "lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-2 border-b border-ink-200 dark:border-ink-700 px-5">
          <Logo variant="mark" className="h-8 w-8" />
          <div>
            <p className="text-sm font-bold leading-tight">LVIGS Mart</p>
            <p className="text-[10px] text-ink-500">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
                    : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-ink-200 dark:border-ink-700 p-4 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-sm text-ink-500 hover:text-brand-600 transition">
            <Store className="h-4 w-4" />
            Back to Store
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 text-sm text-ink-500 hover:text-rose-600 transition">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-ink-200 bg-white px-4 dark:border-ink-700 dark:bg-ink-800 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-6 w-6 text-ink-600" />
          </button>
          <h1 className="text-lg font-bold">Admin</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">A</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
