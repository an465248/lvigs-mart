"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { ClipboardList, Search, Filter } from "lucide-react";

interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const sampleLogs: AuditLog[] = [
  { id: "1", actorId: "admin-1", actorRole: "ADMIN", action: "SELLER_APPROVED", resource: "seller", resourceId: "seller-1", metadata: { storeName: "LVIGS Official Store" }, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", actorId: "admin-1", actorRole: "ADMIN", action: "PRODUCT_APPROVED", resource: "product", resourceId: "prod-1", createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "3", actorId: "admin-2", actorRole: "ADMIN", action: "SELLER_SUSPENDED", resource: "seller", resourceId: "seller-3", metadata: { reason: "Policy violation" }, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "4", actorId: "admin-1", actorRole: "ADMIN", action: "PRODUCT_REJECTED", resource: "product", resourceId: "prod-5", metadata: { reason: "Missing images" }, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: "5", actorId: "admin-3", actorRole: "ADMIN", action: "PAYOUT_PROCESSED", resource: "payout", resourceId: "payout-1", metadata: { amount: 45000, reference: "TXN-12345" }, createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: "6", actorId: "admin-1", actorRole: "ADMIN", action: "SELLER_REGISTERED", resource: "seller", resourceId: "seller-5", metadata: { storeName: "Tech World" }, createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: "7", actorId: "admin-2", actorRole: "ADMIN", action: "ORDER_STATUS_CHANGED", resource: "order", resourceId: "order-12", metadata: { from: "PLACED", to: "CONFIRMED" }, createdAt: new Date(Date.now() - 432000000).toISOString() },
  { id: "8", actorId: "admin-1", actorRole: "ADMIN", action: "COUPON_CREATED", resource: "coupon", resourceId: "coupon-3", metadata: { code: "SAVE20", discount: "20%" }, createdAt: new Date(Date.now() - 518400000).toISOString() },
];

const actionColors: Record<string, string> = {
  SELLER_APPROVED: "bg-emerald-100 text-emerald-700",
  SELLER_REJECTED: "bg-rose-100 text-rose-700",
  SELLER_SUSPENDED: "bg-amber-100 text-amber-700",
  SELLER_REACTIVATED: "bg-blue-100 text-blue-700",
  SELLER_REGISTERED: "bg-violet-100 text-violet-700",
  PRODUCT_APPROVED: "bg-emerald-100 text-emerald-700",
  PRODUCT_REJECTED: "bg-rose-100 text-rose-700",
  PAYOUT_PROCESSED: "bg-blue-100 text-blue-700",
  ORDER_STATUS_CHANGED: "bg-violet-100 text-violet-700",
  COUPON_CREATED: "bg-amber-100 text-amber-700",
};

export default function AdminAuditLogsPage() {
  const [logs] = useState(sampleLogs);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = logs.filter(l => {
    if (filter && l.action !== filter) return false;
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.resource.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-ink-500">Track all admin actions and changes</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm dark:border-ink-700 dark:bg-ink-800"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800"
        >
          <option value="">All Actions</option>
          <option value="SELLER_APPROVED">Seller Approved</option>
          <option value="SELLER_REJECTED">Seller Rejected</option>
          <option value="SELLER_SUSPENDED">Seller Suspended</option>
          <option value="PRODUCT_APPROVED">Product Approved</option>
          <option value="PRODUCT_REJECTED">Product Rejected</option>
          <option value="PAYOUT_PROCESSED">Payout Processed</option>
          <option value="ORDER_STATUS_CHANGED">Order Status Changed</option>
          <option value="COUPON_CREATED">Coupon Created</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-ink-700 text-left">
                <th className="px-5 py-3 font-semibold text-ink-500">Action</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Resource</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Actor</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Details</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700/50">
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${actionColors[l.action] || "bg-ink-100 text-ink-600"}`}>
                      {l.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium capitalize">{l.resource}</td>
                  <td className="px-5 py-3 text-ink-500">{l.actorId}</td>
                  <td className="px-5 py-3 text-xs text-ink-500">
                    {l.metadata ? Object.entries(l.metadata).map(([k, v]) => `${k}: ${v}`).join(", ") : "-"}
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-400">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
