"use client";

import { useEffect, useState } from "react";
import { sellerMock } from "@/lib/seller-mock";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { relativeTime } from "@/lib/utils";
import { RotateCcw, CheckCircle, XCircle } from "lucide-react";

const returnStatusColors: Record<string, string> = {
  REQUESTED: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
  PICKED_UP: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  REFUNDED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
};

export default function SellerReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);

  useEffect(() => { setReturns(sellerMock.getReturns()); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Returns</h1>
        <p className="text-sm text-ink-500">{returns.length} return requests</p>
      </div>

      <div className="space-y-3">
        {returns.map(r => (
          <Card key={r.id}>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-ink-500" />
                    <p className="font-bold">{r.orderId}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${returnStatusColors[r.status] || ""}`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-ink-600">{r.productTitle}</p>
                  <p className="text-xs text-ink-500">Customer: {r.customerName} • Reason: {r.reason}</p>
                  <p className="text-xs text-ink-400">{relativeTime(r.createdAt)}</p>
                </div>
                {r.status === "REQUESTED" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setReturns(prev => prev.map(x => x.id === r.id ? { ...x, status: "APPROVED" } : x))}>
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setReturns(prev => prev.map(x => x.id === r.id ? { ...x, status: "REJECTED" } : x))}>
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        {returns.length === 0 && <Card><div className="px-4 py-12 text-center text-ink-500">No return requests</div></Card>}
      </div>
    </div>
  );
}
