"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Package, MapPin, Navigation, Clock } from "lucide-react";

const sampleAvailable = [
  { id: "sh4", shortId: "LVIGS-9004", items: "MacBook Air M3 x1", pickupAddress: "LVIGS Warehouse, HSR Layout", deliveryAddress: "12 CG Road, Ahmedabad - 380001", amount: 114900, distance: "3.2 km" },
  { id: "sh5", shortId: "LVIGS-9005", items: "Sony WH-1000XM5 x2", pickupAddress: "LVIGS Warehouse, Koramangala", deliveryAddress: "56 100 Feet Road, Chennai - 600034", amount: 59980, distance: "5.1 km" },
  { id: "sh6", shortId: "LVIGS-9006", items: "OnePlus 12 x1, Cases x3", pickupAddress: "LVIGS Warehouse, Electronic City", deliveryAddress: "23 Park Street, Kolkata - 700016", amount: 67999, distance: "2.8 km" },
];

export default function DeliveryAvailablePage() {
  const [available] = useState(sampleAvailable);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Available Deliveries</h1>
        <p className="text-sm text-ink-500">{available.length} available near you</p>
      </div>

      <div className="space-y-4">
        {available.map(d => (
          <Card key={d.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{d.shortId}</p>
                  <p className="mt-1 text-sm text-ink-600">{d.items}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatINR(d.amount)}</p>
                  <p className="text-xs text-ink-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {d.distance}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-ink-50 p-2 dark:bg-ink-700/50">
                  <p className="text-[10px] font-semibold text-ink-400 uppercase">Pickup</p>
                  <p className="text-xs text-ink-600 flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.pickupAddress}</p>
                </div>
                <div className="rounded-lg bg-ink-50 p-2 dark:bg-ink-700/50">
                  <p className="text-[10px] font-semibold text-ink-400 uppercase">Delivery</p>
                  <p className="text-xs text-ink-600 flex items-center gap-1"><Navigation className="h-3 w-3" /> {d.deliveryAddress}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button className="flex items-center gap-1 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700">
                  <Package className="h-4 w-4" /> Accept Delivery
                </button>
                <button className="rounded-lg bg-ink-100 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-200 dark:bg-ink-700">
                  Skip
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
