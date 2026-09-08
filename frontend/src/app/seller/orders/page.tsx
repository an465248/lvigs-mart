"use client";

import { useEffect, useState } from "react";
import { sellerMock, type SellerOrder } from "@/lib/seller-mock";
import { formatINR, relativeTime } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, ChevronDown } from "lucide-react";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  ACCEPTED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  PACKING: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  READY_TO_SHIP: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  SHIPPED: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
  RETURNED: "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-300",
};

const STATUS_FLOW: SellerOrder["status"][] = ["NEW", "ACCEPTED", "PACKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"];

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => setOrders(sellerMock.getOrders());
  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.shortId.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdvanceStatus = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) return;
    sellerMock.updateOrderStatus(orderId, STATUS_FLOW[currentIdx + 1]);
    load();
  };

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
          {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(o => {
          const currentIdx = STATUS_FLOW.indexOf(o.status);
          const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;
          const nextStatus = canAdvance ? STATUS_FLOW[currentIdx + 1] : null;

          return (
            <Card key={o.id}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{o.shortId}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[o.status] || ""}`}>{o.status.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm text-ink-500">{o.customerName} • {o.customerMobile}</p>
                    <p className="text-xs text-ink-400">{relativeTime(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatINR(o.total)}</p>
                    <p className="text-xs text-ink-500">{o.paymentMethod} • {o.paymentStatus}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {o.items.map((item, i) => (
                    <img key={i} src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover" title={`${item.title} x${item.quantity}`} />
                  ))}
                  <span className="text-xs text-ink-500">{o.items.length} item(s)</span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                  <span>Deliver to: {o.address}</span>
                </div>

                {nextStatus && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleAdvanceStatus(o.id)}>
                      Mark as {nextStatus.replace(/_/g, " ")}
                    </Button>
                    {o.status === "NEW" && (
                      <Button size="sm" variant="danger" onClick={() => { sellerMock.updateOrderStatus(o.id, "CANCELLED"); load(); }}>
                        Reject
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card><div className="px-4 py-12 text-center text-ink-500">No orders found</div></Card>
        )}
      </div>
    </div>
  );
}
