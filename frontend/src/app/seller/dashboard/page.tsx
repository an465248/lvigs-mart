"use client";

import { useEffect, useState } from "react";
import { sellerMock, type SellerProfile } from "@/lib/seller-mock";
import { formatINR, formatNumber } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { TrendingUp, ShoppingCart, Package, AlertTriangle, Wallet, Clock, ArrowUpRight, CreditCard, RotateCcw, DollarSign, BarChart3 } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  CONFIRMED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  PACKED: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  SHIPPED: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
  RETURNED: "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-300",
};

export default function SellerDashboardPage() {
  const [data, setData] = useState<ReturnType<typeof sellerMock.getDashboard> | null>(null);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [chartData, setChartData] = useState<{ date: string; sales: number; orders: number }[]>([]);

  useEffect(() => {
    setData(sellerMock.getDashboard());
    setProfile(sellerMock.getProfile());
    // Generate sample chart data
    const days = 30;
    const chart = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      chart.push({
        date: d.toISOString().split("T")[0],
        sales: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 20) + 5,
      });
    }
    setChartData(chart);
  }, []);

  if (!data) return <div className="flex h-64 items-center justify-center text-ink-500">Loading...</div>;

  const metrics = [
    { label: "Today's Sales", value: formatINR(data.stats.todaySales), icon: TrendingUp, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300" },
    { label: "Total Sales", value: formatINR(data.stats.totalSales), icon: Wallet, color: "bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-300" },
    { label: "Total Orders", value: formatNumber(data.stats.totalOrders), icon: ShoppingCart, color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300" },
    { label: "Pending Orders", value: formatNumber(data.stats.pendingOrders), icon: Clock, color: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300" },
    { label: "Products", value: formatNumber(data.stats.totalProducts), icon: Package, color: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300" },
    { label: "Low Stock", value: formatNumber(data.stats.lowStockProducts), icon: AlertTriangle, color: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300" },
  ];

  const earnings = [
    { label: "Available Balance", value: formatINR(data.stats.earnings * 0.7), icon: DollarSign, color: "text-emerald-600" },
    { label: "Pending Payout", value: formatINR(data.stats.pendingSettlement), icon: Clock, color: "text-amber-600" },
    { label: "Completed Payout", value: formatINR(data.stats.earnings * 0.2), icon: CreditCard, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {profile?.storeName}</h1>
          <p className="text-sm text-ink-500">Here&apos;s your store overview</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${profile?.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-amber-100 text-amber-700"}`}>
            {profile?.status}
          </span>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${profile?.kycStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-amber-100 text-amber-700"}`}>
            KYC: {profile?.kycStatus}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${m.color}`}><Icon className="h-5 w-5" /></div>
                </div>
                <p className="mt-3 text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-ink-500">{m.label}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Sales Chart */}
      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Sales Trend (30 Days)</h2>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-end gap-1 h-32">
            {chartData.map((d, i) => {
              const maxSales = Math.max(...chartData.map(c => c.sales));
              const height = maxSales > 0 ? (d.sales / maxSales) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-accent-500 rounded-t-sm hover:bg-accent-600 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${d.date}: ${formatINR(d.sales)} (${d.orders} orders)`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-ink-400">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[chartData.length - 1]?.date}</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-bold">Recent Orders</h2>
              <Link href="/seller/orders" className="text-xs font-semibold text-accent-600 hover:text-accent-700">View all</Link>
            </div>
            <div className="divide-y dark:divide-ink-700">
              {data.recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold">{o.shortId}</p>
                    <p className="text-xs text-ink-500">{o.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatINR(o.total)}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[o.status] || ""}`}>{o.status}</span>
                  </div>
                </div>
              ))}
              {data.recentOrders.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-500">No orders yet</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-bold">Earnings</h2>
              <Link href="/seller/settings" className="text-xs font-semibold text-accent-600 hover:text-accent-700">Payouts</Link>
            </div>
            <CardBody className="space-y-3">
              {earnings.map(e => {
                const Icon = e.icon;
                return (
                  <div key={e.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${e.color}`} />
                      <span className="text-sm text-ink-500">{e.label}</span>
                    </div>
                    <span className="text-sm font-semibold">{e.value}</span>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-500">Returns</span>
                <span className="text-sm font-semibold">{data.stats.returns}</span>
              </div>
              <Link href="/seller/returns" className="mt-2 flex items-center gap-1 text-xs font-semibold text-accent-600 hover:text-accent-700">
                <RotateCcw className="h-3 w-3" /> Manage Returns
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
