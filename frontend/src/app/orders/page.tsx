"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { mockApi } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { Package, ChevronRight, CheckCircle, Truck, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { color: string; icon: any }> = {
  PLACED: { color: "text-amber-600", icon: Clock },
  CONFIRMED: { color: "text-brand-600", icon: CheckCircle },
  PACKED: { color: "text-brand-600", icon: Package },
  SHIPPED: { color: "text-brand-600", icon: Truck },
  OUT_FOR_DELIVERY: { color: "text-accent-600", icon: Truck },
  DELIVERED: { color: "text-emerald-600", icon: CheckCircle },
  CANCELLED: { color: "text-rose-600", icon: XCircle },
  RETURNED: { color: "text-rose-600", icon: XCircle },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { setOrders(mockApi.getOrders()); }, []);

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <h1 className="text-xl font-bold mb-4">My Orders</h1>
        {orders.length === 0 ? (
          <EmptyState icon={<Package className="h-8 w-8" />} title="No orders yet" description="Your orders will appear here after your first purchase." action={<Link href="/" className="btn-base bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">Start shopping</Link>} />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const sc = statusConfig[order.status] || statusConfig.PLACED;
              const Icon = sc.icon;
              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="card-base flex items-center gap-4 p-4 transition hover:shadow-card">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-700">
                    <img src={order.items[0]?.image || ""} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <span className="font-mono font-semibold text-ink-800 dark:text-white">{order.shortId}</span>
                      <span>·</span>
                      <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium line-clamp-1">{order.items.map((i) => i.title).join(", ")}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cn("flex items-center gap-1 text-xs font-semibold", sc.color)}>
                        <Icon className="h-3.5 w-3.5" /> {order.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-bold">{formatINR(order.totals.payable)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-ink-400" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}