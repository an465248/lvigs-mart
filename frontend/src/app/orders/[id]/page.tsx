"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { mockApi } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { ArrowLeft, Package, Truck, MapPin, CreditCard, CheckCircle, XCircle, Clock, Phone, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const timelineStatuses = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

const statusInfo: Record<string, { icon: any; color: string; bg: string }> = {
  PLACED: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  CONFIRMED: { icon: CheckCircle, color: "text-brand-600", bg: "bg-brand-100" },
  PACKED: { icon: Package, color: "text-brand-600", bg: "bg-brand-100" },
  SHIPPED: { icon: Truck, color: "text-brand-600", bg: "bg-brand-100" },
  OUT_FOR_DELIVERY: { icon: Truck, color: "text-accent-600", bg: "bg-accent-100" },
  DELIVERED: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  CANCELLED: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-100" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getOrder(params.id as string).then((o) => { setOrder(o || null); setLoading(false); });
  }, [params.id]);

  const handleCancel = async () => {
    if (!order || !confirm("Are you sure you want to cancel this order?")) return;
    await mockApi.cancelOrder(order.id);
    toast.push("Order cancelled successfully", "success");
    const updated = await mockApi.getOrder(params.id as string);
    setOrder(updated || null);
  };

  if (loading) return <div className="flex min-h-dvh items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
  if (!order) return <div className="flex min-h-dvh items-center justify-center text-ink-500">Order not found</div>;

  const currentIdx = timelineStatuses.indexOf(order.status as any);

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back</button>

        <div className="mb-2 text-sm text-ink-500">Order <span className="font-mono font-semibold text-ink-800 dark:text-white">{order.shortId}</span></div>
        <h1 className="text-xl font-bold mb-6">Order Details</h1>

        {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
          <div className="card-base p-5 mb-6">
            <h3 className="mb-4 font-bold">Tracking</h3>
            <div className="flex items-start justify-between">
              {timelineStatuses.map((s, i) => {
                const info = statusInfo[s] || statusInfo.PLACED;
                const Icon = info.icon;
                const active = i <= currentIdx;
                const current = i === currentIdx;
                return (
                  <div key={s} className="flex flex-1 flex-col items-center text-center">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full transition", active ? info.bg : "bg-ink-100 dark:bg-ink-700", current && "ring-4 ring-brand-200 dark:ring-brand-800")}>
                      <Icon className={cn("h-5 w-5", active ? info.color : "text-ink-400")} />
                    </div>
                    <span className={cn("mt-2 text-[11px] font-medium", active ? "text-ink-900 dark:text-white" : "text-ink-400")}>{s.replace(/_/g, " ")}</span>
                    {i < timelineStatuses.length - 1 && <div className={cn("absolute h-0.5", i < currentIdx ? "bg-brand-500" : "bg-ink-200")} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card-base p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-brand-500" /> Delivery Address</h3>
            <p className="text-sm">{order.address?.name}, {order.address?.line1}</p>
            <p className="text-sm text-ink-500">{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
          </div>
          <div className="card-base p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><CreditCard className="h-4 w-4 text-brand-500" /> Payment</h3>
            <p className="text-sm">{order.payment?.method === "COD" ? "Cash on Delivery" : order.payment?.method}</p>
            <p className={cn("text-sm font-semibold", order.payment?.status === "SUCCESS" ? "text-emerald-600" : "text-amber-600")}>{order.payment?.status}</p>
          </div>
        </div>

        <div className="card-base mt-4 p-5">
          <h3 className="mb-3 font-bold">Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-700">
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                  <p className="text-xs text-ink-500">Qty: {item.quantity} × {formatINR(item.price)}</p>
                </div>
                <span className="font-bold text-sm">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-3 dark:border-ink-700">
            <div className="flex justify-between text-sm"><span>Item total</span><span>{formatINR(order.totals.mrpTotal)}</span></div>
            <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>-{formatINR(order.totals.savings)}</span></div>
            <div className="flex justify-between text-sm"><span>Delivery</span><span>{order.totals.freeDelivery ? "FREE" : formatINR(order.totals.deliveryFee)}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Total paid</span><span>{formatINR(order.totals.payable)}</span></div>
          </div>
        </div>

        {["PLACED", "CONFIRMED"].includes(order.status) && (
          <div className="mt-4">
            <Button variant="danger" onClick={handleCancel}>Cancel Order</Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}