"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Gift, TrendingUp, Clock, ChevronRight, Award, ShoppingBag, Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { useStore } from "@/state/store";
import { formatNumber, cn } from "@/lib/utils";
import { getLoyaltyTransactions, redeemLoyaltyPoints } from "@/lib/api-phase6";
import type { LoyaltyTier } from "@/lib/types";

const TIER_CONFIG: Record<LoyaltyTier, { label: string; color: string; min: number; icon: string; bg: string }> = {
  BRONZE: { label: "Bronze", color: "text-amber-700", min: 0, icon: "🥉", bg: "from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30" },
  SILVER: { label: "Silver", color: "text-slate-500", min: 5000, icon: "🥈", bg: "from-slate-100 to-slate-200 dark:from-slate-800/30 dark:to-slate-700/30" },
  GOLD: { label: "Gold", color: "text-amber-500", min: 15000, icon: "🥇", bg: "from-amber-200 to-yellow-200 dark:from-amber-800/30 dark:to-yellow-800/30" },
  PLATINUM: { label: "Platinum", color: "text-violet-600", min: 50000, icon: "💎", bg: "from-violet-100 to-purple-200 dark:from-violet-900/30 dark:to-purple-800/30" },
};

const TIER_ORDER: LoyaltyTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

const EARN_METHODS = [
  { icon: ShoppingBag, title: "Shop on LVIGS", desc: "Earn 1 point per ₹10 spent" },
  { icon: Star, title: "Write Reviews", desc: "Earn 50 points per verified review" },
  { icon: Gift, title: "Refer Friends", desc: "Earn 150 points per referral" },
  { icon: Zap, title: "Flash Deal Purchases", desc: "Earn 2x points on flash deals" },
];

export default function LoyaltyPage() {
  const { loyalty } = useStore();
  const [tab, setTab] = useState<"overview" | "history" | "redeem">("overview");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "history") {
      setLoading(true);
      getLoyaltyTransactions(1, 50)
        .then((res) => setHistory(res.items || []))
        .catch(() => setHistory([]))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const handleRedeem = useCallback(async (points: number) => {
    try {
      await redeemLoyaltyPoints(points);
      alert(`Successfully redeemed ${points} points!`);
    } catch (e: any) {
      alert(e.message || "Failed to redeem points");
    }
  }, []);

  const tier = loyalty?.tier || "SILVER";
  const config = TIER_CONFIG[tier];
  const nextTierIdx = TIER_ORDER.indexOf(tier) + 1;
  const nextTier = nextTierIdx < TIER_ORDER.length ? TIER_ORDER[nextTierIdx] : null;
  const nextConfig = nextTier ? TIER_CONFIG[nextTier] : null;
  const progress = nextConfig
    ? Math.min(100, ((loyalty?.lifetimePoints || 0) - config.min) / (nextConfig.min - config.min) * 100)
    : 100;

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <nav className="mb-4 flex items-center gap-2 text-xs text-ink-500">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-ink-900 dark:text-white">Loyalty</span>
        </nav>

        <div className={cn("rounded-2xl bg-gradient-to-br p-5 text-white", config.bg)}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{config.icon}</span>
            <div>
              <p className="text-sm opacity-80">Current Tier</p>
              <h1 className="text-2xl font-extrabold">{config.label}</h1>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs opacity-70">Available Points</p>
              <p className="text-xl font-bold">{formatNumber(loyalty?.points || 0)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Lifetime Points</p>
              <p className="text-xl font-bold">{formatNumber(loyalty?.lifetimePoints || 0)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Expiring Soon</p>
              <p className="text-xl font-bold">{formatNumber(loyalty?.pointsExpiringSoon || 0)}</p>
            </div>
          </div>
        </div>

        {nextConfig && (
          <div className="mt-4 rounded-xl border bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
            <div className="flex items-center justify-between text-sm">
              <span className={cn("font-semibold", config.color)}>{config.label}</span>
              <span className={cn("font-semibold", nextConfig.color)}>{nextConfig.label}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-ink-500">
              {formatNumber((nextConfig.min || 0) - (loyalty?.lifetimePoints || 0))} more points to {nextConfig.label}
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {(["overview", "history", "redeem"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                tab === t
                  ? "bg-brand-600 text-white"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
              )}
            >
              {t === "overview" ? "Overview" : t === "history" ? "History" : "Redeem"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="mt-4 space-y-3">
            <h2 className="text-lg font-bold">How to Earn Points</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {EARN_METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <Card key={m.title}>
                    <CardBody className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{m.title}</p>
                        <p className="text-xs text-ink-500">{m.desc}</p>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="mt-4">
            <h2 className="mb-3 text-lg font-bold">Points History</h2>
            {loading ? (
              <div className="py-8 text-center text-ink-500">Loading...</div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-ink-500">No transactions yet</div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-white dark:border-ink-700 dark:bg-ink-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-ink-50 text-left text-xs text-ink-500 dark:border-ink-700 dark:bg-ink-800">
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5 text-right">Points</th>
                      <th className="px-4 py-2.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx: any) => (
                      <tr key={tx.id} className="border-b last:border-0 dark:border-ink-700">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {tx.type === "EARNED" && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                            {tx.type === "REDEEMED" && <Gift className="h-3.5 w-3.5 text-brand-500" />}
                            {tx.type === "EXPIRED" && <Clock className="h-3.5 w-3.5 text-ink-400" />}
                            <span className="font-medium">{tx.description}</span>
                          </div>
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-right font-semibold",
                          tx.points > 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {tx.points > 0 ? "+" : ""}{tx.points}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-ink-500">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "redeem" && (
          <div className="mt-4 space-y-3">
            <h2 className="text-lg font-bold">Redeem Points</h2>
            <p className="text-sm text-ink-500">100 points = ₹10 discount</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[100, 250, 500, 1000].map((pts) => (
                <Card key={pts}>
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">{pts} Points</p>
                      <p className="text-sm text-ink-500">₹{pts / 10} off</p>
                    </div>
                    <Button
                      size="sm"
                      disabled={(loyalty?.points || 0) < pts}
                      onClick={() => handleRedeem(pts)}
                    >
                      Redeem
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
