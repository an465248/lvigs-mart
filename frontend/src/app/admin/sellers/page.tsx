"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminMock, type AdminSeller } from "@/lib/admin-mock";
import { formatINR, relativeTime } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Search, Eye, CheckCircle, XCircle, Clock, AlertTriangle, Store } from "lucide-react";

const sellerStatusTone: Record<string, "success" | "warning" | "danger" | "muted" | "brand"> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
  REJECTED: "danger",
};

const kycStatusTone: Record<string, "success" | "warning" | "danger" | "muted" | "brand"> = {
  APPROVED: "success",
  SUBMITTED: "brand",
  NOT_STARTED: "muted",
  REJECTED: "danger",
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");

  const load = () => setSellers(adminMock.getSellers());
  useEffect(() => { load(); }, []);

  const filtered = sellers.filter(s => {
    const matchSearch = !search ||
      s.storeName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerMobile.includes(search);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchKyc = kycFilter === "all" || s.kycStatus === kycFilter;
    return matchSearch && matchStatus && matchKyc;
  });

  const pendingCount = sellers.filter(s => s.kycStatus === "SUBMITTED").length;
  const activeCount = sellers.filter(s => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sellers</h1>
        <p className="text-sm text-ink-500">
          {sellers.length} sellers total
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {pendingCount} pending KYC review
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by store, owner, email, mobile..."
            className="input-base pl-10"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base w-auto min-w-[140px]">
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={kycFilter} onChange={e => setKycFilter(e.target.value)} className="input-base w-auto min-w-[140px]">
          <option value="all">All KYC</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/30">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-ink-500">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-ink-500">Active Sellers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950/30">
              <Store className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sellers.length}</p>
              <p className="text-xs text-ink-500">Total Sellers</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ink-50 text-left text-xs font-semibold uppercase text-ink-500 dark:border-ink-700 dark:bg-ink-800">
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">KYC</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-ink-700">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={s.logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium">{s.storeName}</p>
                        <p className="text-xs text-ink-500">{s.city}, {s.state}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium">{s.ownerName}</p>
                    <p className="text-xs text-ink-500">{s.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{s.productCount}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{s.totalRevenue > 0 ? formatINR(s.totalRevenue) : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={kycStatusTone[s.kycStatus]}>
                      {s.kycStatus.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={sellerStatusTone[s.status]}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">{relativeTime(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/sellers/${s.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="mr-1 h-3.5 w-3.5" /> View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-ink-500">No sellers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
