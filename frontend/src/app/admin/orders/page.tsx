"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminMock } from "@/lib/admin-mock";
import type { Order } from "@/lib/types";
import { formatINR, relativeTime } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Search, Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  CONFIRMED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  PACKED: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  SHIPPED: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
  RETURNED: "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-300",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { setOrders(adminMock.getOrders()); }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.shortId.toLowerCase().includes(search.toLowerCase()) || o.items.some(i => i.title.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-ink-500">{orders.length} orders total</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="input-base pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base w-auto min-w-[160px]">
          <option value="all">All Status</option>
          <option value="PLACED">Placed</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PACKED">Packed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500 dark:border-ink-700 dark:bg-ink-800">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-ink-700">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/50 transition">
                  <td className="px-4 py-3 font-semibold">{o.shortId}</td>
                  <td className="px-4 py-3 text-xs text-ink-600">{o.address.name}</td>
                  <td className="px-4 py-3 text-xs">{o.items.length} item(s)</td>
                  <td className="px-4 py-3 font-semibold">{formatINR(o.totals.payable)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[o.status] || ""}`}>
                      {o.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">{relativeTime(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`}>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-950/30 dark:text-brand-300">
                        <Eye className="h-3.5 w-3.5" /> View
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
