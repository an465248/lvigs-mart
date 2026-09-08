"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { useStore } from "@/state/store";
import { User, Package, Heart, MapPin, Bell, Settings, Headphones, LogOut, ChevronRight } from "lucide-react";

const links = [
  { href: "/orders", icon: Package, label: "My Orders" },
  { href: "/wishlist", icon: Heart, label: "Wishlist" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/help", icon: Headphones, label: "Help Center" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function ProfilePage() {
  const { user, logout } = useStore();
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <div className="card-base mb-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{user?.name || "Guest"}</h1>
              <p className="text-sm text-ink-500">{user?.email || user?.mobile || "Not signed in"}</p>
            </div>
          </div>
          {!user && (
            <Link href="/auth/login" className="mt-4 block w-full rounded-xl bg-brand-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700">
              Login / Sign up
            </Link>
          )}
        </div>

        <div className="card-base divide-y dark:divide-ink-700">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link key={l.href} href={l.href} className="flex items-center gap-3 p-4 hover:bg-ink-50 dark:hover:bg-ink-700 transition">
                <Icon className="h-5 w-5 text-ink-500" />
                <span className="flex-1 font-medium text-sm">{l.label}</span>
                <ChevronRight className="h-4 w-4 text-ink-400" />
              </Link>
            );
          })}
          {user && (
            <button onClick={() => { logout(); router.push("/"); }} className="flex w-full items-center gap-3 p-4 text-left hover:bg-rose-50 dark:hover:bg-rose-950/20 transition text-rose-600">
              <LogOut className="h-5 w-5" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}