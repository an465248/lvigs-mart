"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Truck, MapPin, Phone, CheckCircle, XCircle, Clock, Navigation } from "lucide-react";

const statusColors: Record<string, string> = {
  CREATED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-violet-100 text-violet-700",
  IN_TRANSIT: "bg-orange-100 text-orange-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

const sampleDeliveries = [
  { id: "sh1", orderId: "ORD-001", shortId: "LVIGS-9001", customerName: "Priya Sharma", customerMobile: "9876543211", items: "iPhone 15 Pro Max x1", address: "12 MG Road, Bengaluru - 560001", status: "OUT_FOR_DELIVERY", amount: 134900, pickupAddress: "LVIGS Warehouse, Whitefield" },
  { id: "sh2", orderId: "ORD-002", shortId: "LVIGS-9002", customerName: "Rahul Verma", customerMobile: "9876543212", items: "Samsung Galaxy S24 Ultra x1", address: "45 CP, New Delhi - 110001", status: "IN_TRANSIT", amount: 129999, pickupAddress: "LVIGS Warehouse, Noida" },
  { id: "sh3", orderId: "ORD-003", shortId: "LVIGS-9003", customerName: "Neha Gupta", customerMobile: "9876543215", items: "boAt Rockerz 450 x2, Noise ColorFit Pro 5 x1", address: "78 Andheri West, Mumbai - 400001", status: "PICKED_UP", amount: 5497, pickupAddress: "LVIGS Warehouse, Andheri" },
];

export default function DeliveryDeliveriesPage() {
  const [deliveries] = useState(sampleDeliveries);
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? deliveries : deliveries.filter(d => d.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Deliveries</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["ALL", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-accent-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-700 dark:text-ink-300"}`}
          >
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(d => (
          <Card key={d.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{d.shortId}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[d.status]}`}>{d.status.replace(/_/g, " ")}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-600">{d.items}</p>
                  <p className="text-xs text-ink-500">Customer: {d.customerName}</p>
                </div>
                <p className="font-bold">{formatINR(d.amount)}</p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-ink-50 p-2 dark:bg-ink-700/50">
                  <p className="text-[10px] font-semibold text-ink-400 uppercase">Pickup</p>
                  <p className="text-xs text-ink-600 flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.pickupAddress}</p>
                </div>
                <div className="rounded-lg bg-ink-50 p-2 dark:bg-ink-700/50">
                  <p className="text-[10px] font-semibold text-ink-400 uppercase">Delivery</p>
                  <p className="text-xs text-ink-600 flex items-center gap-1"><Navigation className="h-3 w-3" /> {d.address}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <a href={`tel:${d.customerMobile}`} className="flex items-center gap-1 rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-200 dark:bg-ink-700">
                  <Phone className="h-3 w-3" /> Call
                </a>
                {d.status === "PICKED_UP" && (
                  <button className="flex items-center gap-1 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700">
                    <Truck className="h-3 w-3" /> Mark In Transit
                  </button>
                )}
                {d.status === "IN_TRANSIT" && (
                  <button className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                    <MapPin className="h-3 w-3" /> Out for Delivery
                  </button>
                )}
                {d.status === "OUT_FOR_DELIVERY" && (
                  <>
                    <button className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      <CheckCircle className="h-3 w-3" /> Delivered
                    </button>
                    <button className="flex items-center gap-1 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-200">
                      <XCircle className="h-3 w-3" /> Failed
                    </button>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
