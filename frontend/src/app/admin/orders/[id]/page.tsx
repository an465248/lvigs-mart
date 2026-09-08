"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminMock } from "@/lib/admin-mock";
import type { Order, OrderStatus } from "@/lib/types";
import { formatINR, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft, CheckCircle, XCircle, Truck, Package, MapPin, CreditCard, Clock } from "lucide-react";
import Link from "next/link";

const STATUS_FLOW: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const statusColors: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  CONFIRMED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  PACKED: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  SHIPPED: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
};

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const o = adminMock.getOrder(id);
    if (!o) { router.push("/admin/orders"); return; }
    setOrder(o);
  }, [id, router]);

  const handleStatus = async (status: OrderStatus) => {
    if (!confirm(`Update order to ${status.replace(/_/g, " ")}?`)) return;
    setUpdating(true);
    await new Promise(r => setTimeout(r, 400));
    const updated = adminMock.updateOrderStatus(order!.id, status);
    if (updated) setOrder(updated);
    setUpdating(false);
  };

  if (!order) return <div className="flex h-64 items-center justify-center text-ink-500">Loading...</div>;

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;
  const nextStatus = canAdvance ? STATUS_FLOW[currentIdx + 1] : null;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order {order.shortId}</h1>
          <p className="text-sm text-ink-500">Placed {relativeTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {nextStatus && order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
            <Button onClick={() => handleStatus(nextStatus)} loading={updating}>
              <CheckCircle className="mr-1 h-4 w-4" /> Mark as {nextStatus.replace(/_/g, " ")}
            </Button>
          )}
          {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
            <Button variant="danger" onClick={() => handleStatus("CANCELLED")} loading={updating}>
              <XCircle className="mr-1 h-4 w-4" /> Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] || ""}`}>
          {order.status.replace(/_/g, " ")}
        </span>
        {order.payment.status === "SUCCESS" && (
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            Paid via {order.payment.method}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Items</CardTitle></CardHeader>
            <CardBody>
              <div className="divide-y dark:divide-ink-700">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <img src={item.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-ink-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatINR(item.price * item.quantity)}</p>
                      {item.mrp > item.price && <p className="text-xs text-ink-400 line-through">{formatINR(item.mrp * item.quantity)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Order Timeline</CardTitle></CardHeader>
            <CardBody>
              <div className="relative ml-3 border-l-2 border-ink-200 dark:border-ink-700 space-y-4">
                {[...order.timeline].reverse().map((t, i) => (
                  <div key={i} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-ink-800 ${i === 0 ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-600"}`} />
                    <p className="text-sm font-medium">{t.status.replace(/_/g, " ")}</p>
                    <p className="text-xs text-ink-500">{relativeTime(t.at)}</p>
                    {t.note && <p className="mt-1 text-xs text-ink-400">{t.note}</p>}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Delivery Address</CardTitle></CardHeader>
            <CardBody>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{order.address.name}</p>
                <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
                <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                <p className="text-ink-500">{order.address.mobile}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatINR(order.totals.priceTotal)}</span></div>
              {order.totals.itemDiscount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>-{formatINR(order.totals.itemDiscount)}</span></div>}
              {order.totals.couponDiscount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Coupon</span><span>-{formatINR(order.totals.couponDiscount)}</span></div>}
              <div className="flex justify-between text-sm"><span>Delivery</span><span>{order.totals.freeDelivery ? "FREE" : formatINR(order.totals.deliveryFee)}</span></div>
              {order.totals.tax > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>{formatINR(order.totals.tax)}</span></div>}
              <div className="border-t pt-2 dark:border-ink-700 flex justify-between font-bold"><span>Total</span><span>{formatINR(order.totals.payable)}</span></div>
              <div className="flex justify-between text-xs text-ink-500 pt-1">
                <span>Method</span><span>{order.payment.method}</span>
              </div>
              <div className="flex justify-between text-xs text-ink-500">
                <span>Status</span>
                <span className={order.payment.status === "SUCCESS" ? "text-emerald-600" : order.payment.status === "REFUNDED" ? "text-rose-600" : "text-amber-600"}>
                  {order.payment.status}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
