"use client";

import { useState, useEffect } from "react";
import { formatINR } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Truck, Package, Clock, CheckCircle, XCircle, Star, ToggleLeft, ToggleRight } from "lucide-react";

const DELIVERY_AUTH_KEY = "lvigs_delivery_auth";

export default function DeliveryDashboardPage() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [stats, setStats] = useState({
    totalDeliveries: 156,
    todayDeliveries: 8,
    pendingDeliveries: 3,
    failedDeliveries: 2,
    activeDeliveries: 2,
    rating: 4.7,
  });

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
  };

  const metrics = [
    { label: "Total Deliveries", value: stats.totalDeliveries, icon: Truck, color: "bg-emerald-50 text-emerald-600" },
    { label: "Today's Deliveries", value: stats.todayDeliveries, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Pending", value: stats.pendingDeliveries, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Active", value: stats.activeDeliveries, icon: Truck, color: "bg-violet-50 text-violet-600" },
    { label: "Failed", value: stats.failedDeliveries, icon: XCircle, color: "bg-rose-50 text-rose-600" },
    { label: "Rating", value: stats.rating, icon: Star, color: "bg-yellow-50 text-yellow-600" },
  ];

  const sampleDeliveries = [
    { id: "sh1", orderId: "ORD-001", customerName: "Priya Sharma", address: "12 MG Road, Bengaluru - 560001", status: "OUT_FOR_DELIVERY", amount: 134900 },
    { id: "sh2", orderId: "ORD-002", customerName: "Rahul Verma", address: "45 CP, New Delhi - 110001", status: "IN_TRANSIT", amount: 129999 },
    { id: "sh3", orderId: "ORD-003", customerName: "Neha Gupta", address: "78 Andheri West, Mumbai - 400001", status: "CREATED", amount: 5497 },
  ];

  const statusColors: Record<string, string> = {
    CREATED: "bg-blue-100 text-blue-700",
    IN_TRANSIT: "bg-orange-100 text-orange-700",
    OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
          <p className="text-sm text-ink-500">Manage your deliveries</p>
        </div>
        <button
          onClick={toggleAvailability}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-ink-100 text-ink-500"}`}
        >
          {isAvailable ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
          {isAvailable ? "Available" : "Offline"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardBody>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${m.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-ink-500">{m.label}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-bold">Active Deliveries</h2>
        </div>
        <div className="divide-y dark:divide-ink-700">
          {sampleDeliveries.map(d => (
            <div key={d.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{d.orderId}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[d.status] || ""}`}>{d.status.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-ink-500 mt-1">{d.customerName}</p>
                <p className="text-xs text-ink-400">{d.address}</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-bold">{formatINR(d.amount)}</p>
                {d.status === "OUT_FOR_DELIVERY" && (
                  <button className="mt-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
                    Mark Delivered
                  </button>
                )}
                {d.status === "CREATED" && (
                  <button className="mt-1 rounded-lg bg-accent-600 px-3 py-1 text-xs font-semibold text-white hover:bg-accent-700">
                    Accept
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
