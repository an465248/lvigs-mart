"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { CreditCard, DollarSign, Clock, CheckCircle, ArrowUpRight } from "lucide-react";

interface Payout {
  id: string;
  amount: number;
  status: string;
  reference?: string;
  periodStart: string;
  periodEnd: string;
  settledAt?: string;
  createdAt: string;
}

const samplePayouts: Payout[] = [
  { id: "p1", amount: 45000, status: "COMPLETED", reference: "TXN-BANK-001", periodStart: "2025-01-01", periodEnd: "2025-01-15", settledAt: "2025-01-16", createdAt: "2025-01-16" },
  { id: "p2", amount: 32500, status: "COMPLETED", reference: "TXN-BANK-002", periodStart: "2025-01-16", periodEnd: "2025-01-31", settledAt: "2025-02-01", createdAt: "2025-02-01" },
  { id: "p3", amount: 28000, status: "PROCESSING", periodStart: "2025-02-01", periodEnd: "2025-02-15", createdAt: "2025-02-16" },
  { id: "p4", amount: 15000, status: "PENDING", periodStart: "2025-02-16", periodEnd: "2025-02-28", createdAt: "2025-03-01" },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

export default function SellerPayoutsPage() {
  const [payouts] = useState(samplePayouts);

  const balance = {
    totalEarnings: 120500,
    pendingEarnings: 43000,
    availableBalance: 28000,
    totalPaid: 77500,
    totalRefunds: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payouts & Earnings</h1>
        <p className="text-sm text-ink-500">Track your earnings and payout history</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Earnings", value: formatINR(balance.totalEarnings), icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
          { label: "Available Balance", value: formatINR(balance.availableBalance), icon: CreditCard, color: "bg-blue-50 text-blue-600" },
          { label: "Pending Earnings", value: formatINR(balance.pendingEarnings), icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "Total Paid", value: formatINR(balance.totalPaid), icon: CheckCircle, color: "bg-violet-50 text-violet-600" },
          { label: "Total Refunds", value: formatINR(balance.totalRefunds), icon: ArrowUpRight, color: "bg-rose-50 text-rose-600" },
        ].map(m => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardBody>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${m.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xl font-bold">{m.value}</p>
                <p className="text-xs text-ink-500">{m.label}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="px-5 pt-5 pb-3">
          <h2 className="font-bold">Payout History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-ink-700 text-left">
                <th className="px-5 py-3 font-semibold text-ink-500">Period</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Amount</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Status</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Reference</th>
                <th className="px-5 py-3 font-semibold text-ink-500">Settled At</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id} className="border-b dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700/50">
                  <td className="px-5 py-3">
                    <p className="font-medium">{p.periodStart} to {p.periodEnd}</p>
                  </td>
                  <td className="px-5 py-3 font-bold">{formatINR(p.amount)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-500">{p.reference || "-"}</td>
                  <td className="px-5 py-3 text-ink-500">{p.settledAt || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
