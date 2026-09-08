"use client";

import { useEffect, useState } from "react";
import { adminMock, type AdminDashboardStats } from "@/lib/admin-mock";
import { formatINR, formatNumber } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Store, Clock, RotateCcw, CreditCard, BarChart3, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; sales: number; orders: number }[]>([]);

  useEffect(() => {
    setStats(adminMock.getDashboardStats());
    const days = 30;
    const chart = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      chart.push({
        date: d.toISOString().split("T")[0],
        sales: Math.floor(Math.random() * 200000) + 50000,
        orders: Math.floor(Math.random() * 100) + 20,
      });
    }
    setChartData(chart);
  }, []);

  if (!stats) return <div className="flex h-64 items-center justify-center text-ink-500">Loading...</div>;

  const marketplaceStats = [
    { label: "Total Users", value: formatNumber(stats.totalUsers), icon: Users, color: "bg-blue-50 text-blue-600", change: "+12%", up: true },
    { label: "Total Sellers", value: "24", icon: Store, color: "bg-violet-50 text-violet-600", change: "+3", up: true },
    { label: "Active Sellers", value: "18", icon: Store, color: "bg-emerald-50 text-emerald-600", change: "+2", up: true },
    { label: "Pending Sellers", value: "4", icon: Clock, color: "bg-amber-50 text-amber-600", change: "0", up: true },
    { label: "Total Products", value: formatNumber(stats.totalProducts), icon: Package, color: "bg-violet-50 text-violet-600", change: "+5%", up: true },
    { label: "Pending Products", value: "12", icon: AlertTriangle, color: "bg-rose-50 text-rose-600", change: "-2", up: false },
    { label: "Total Orders", value: formatNumber(stats.totalOrders), icon: ShoppingCart, color: "bg-amber-50 text-amber-600", change: "+8%", up: true },
    { label: "Today's Orders", value: "47", icon: ShoppingCart, color: "bg-blue-50 text-blue-600", change: "+15", up: true },
    { label: "Total Revenue", value: formatINR(stats.totalRevenue), icon: DollarSign, color: "bg-emerald-50 text-emerald-600", change: "+18%", up: true },
    { label: "Platform Commission", value: formatINR(stats.totalRevenue * 0.10), icon: CreditCard, color: "bg-violet-50 text-violet-600", change: "+18%", up: true },
    { label: "Pending Payouts", value: formatINR(stats.totalRevenue * 0.05), icon: Clock, color: "bg-amber-50 text-amber-600", change: "0", up: true },
    { label: "Returns", value: "8", icon: RotateCcw, color: "bg-rose-50 text-rose-600", change: "+1", up: true },
  ];

  const topCategories = [
    { name: "Electronics", sold: 1245, revenue: 2450000 },
    { name: "Fashion", sold: 890, revenue: 890000 },
    { name: "Home & Kitchen", sold: 654, revenue: 654000 },
    { name: "Beauty", sold: 432, revenue: 432000 },
    { name: "Sports", sold: 321, revenue: 321000 },
  ];

  const ordersByStatus = [
    { status: "PLACED", count: 45 },
    { status: "CONFIRMED", count: 32 },
    { status: "PACKED", count: 28 },
    { status: "SHIPPED", count: 56 },
    { status: "OUT_FOR_DELIVERY", count: 18 },
    { status: "DELIVERED", count: 234 },
    { status: "CANCELLED", count: 12 },
    { status: "RETURNED", count: 8 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-ink-500">Welcome back. Here&apos;s your marketplace overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {marketplaceStats.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${m.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${m.up ? "text-emerald-600" : "text-rose-600"}`}>
                    {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {m.change}
                  </span>
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
          <h2 className="font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Daily Sales (30 Days)</h2>
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
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-bold">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all</Link>
            </div>
            <div className="divide-y dark:divide-ink-700">
              {stats.recentOrders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-ink-50 dark:hover:bg-ink-700/50 transition">
                  <div>
                    <p className="text-sm font-semibold">{o.shortId}</p>
                    <p className="text-xs text-ink-500">{o.items[0]?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatINR(o.totals.payable)}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[o.status] || ""}`}>{o.status.replace(/_/g, " ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Orders by Status */}
        <div>
          <Card>
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-bold">Orders by Status</h2>
            </div>
            <div className="space-y-2 px-5 pb-5">
              {ordersByStatus.map(s => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[s.status]}`}>{s.status.replace(/_/g, " ")}</span>
                  <span className="text-sm font-semibold">{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Top Categories */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <h2 className="font-bold">Top Categories</h2>
        </div>
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-5">
          {topCategories.map(c => (
            <div key={c.name} className="rounded-lg border p-3 dark:border-ink-700">
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-ink-500">{c.sold} sold</p>
              <p className="text-xs font-bold text-emerald-600">{formatINR(c.revenue)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/sellers" className="rounded-xl border bg-white p-4 text-center font-semibold text-ink-700 hover:bg-ink-50 transition dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700">
          <Store className="mx-auto h-6 w-6 mb-2 text-violet-600" />
          Manage Sellers
        </Link>
        <Link href="/admin/products" className="rounded-xl border bg-white p-4 text-center font-semibold text-ink-700 hover:bg-ink-50 transition dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700">
          <Package className="mx-auto h-6 w-6 mb-2 text-violet-600" />
          Approve Products
        </Link>
        <Link href="/admin/commissions" className="rounded-xl border bg-white p-4 text-center font-semibold text-ink-700 hover:bg-ink-50 transition dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700">
          <CreditCard className="mx-auto h-6 w-6 mb-2 text-emerald-600" />
          Commissions
        </Link>
        <Link href="/admin/banners" className="rounded-xl border bg-white p-4 text-center font-semibold text-ink-700 hover:bg-ink-50 transition dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700">
          <FileText className="mx-auto h-6 w-6 mb-2 text-amber-600" />
          Banners & Offers
        </Link>
      </div>
    </div>
  );
}
