"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Check, Crown, Star, Zap, Shield, Truck, Percent, Headphones, Gift } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { useStore } from "@/state/store";
import { formatINR, cn } from "@/lib/utils";
import { getMembershipPlans, subscribeMembership, getReferralCode } from "@/lib/api-phase6";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    period: "FREE" as const,
    color: "border-ink-200 dark:border-ink-700",
    badge: "Default",
    badgeTone: "muted" as const,
    icon: Star,
    features: [
      "Standard delivery",
      "Basic customer support",
      "Access to all products",
      "Standard return policy",
    ],
    notIncluded: [
      "Free delivery",
      "Priority support",
      "Exclusive deals",
      "Early access to sales",
      "Birthday rewards",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: 499,
    period: "YEARLY" as const,
    color: "border-brand-300 dark:border-brand-700",
    badge: "Popular",
    badgeTone: "brand" as const,
    icon: Crown,
    features: [
      "Free delivery on all orders",
      "Priority customer support",
      "5% extra discount on all products",
      "Extended 30-day returns",
      "Early access to sales",
      "Monthly bonus points",
    ],
    notIncluded: [
      "Personal shopping assistant",
      "Exclusive member events",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 1499,
    period: "YEARLY" as const,
    color: "border-amber-300 dark:border-amber-700",
    badge: "Best Value",
    badgeTone: "accent" as const,
    icon: Zap,
    features: [
      "Free express delivery",
      "Dedicated personal assistant",
      "10% extra discount on all products",
      "60-day hassle-free returns",
      "First access to new products",
      "Double bonus points",
      "Birthday rewards & gifts",
      "Exclusive member events",
      "Priority customer service",
    ],
    notIncluded: [],
  },
];

const COMPARISON = [
  { feature: "Delivery", basic: "Standard", plus: "Free", premium: "Free Express" },
  { feature: "Discount", basic: "—", plus: "5% extra", premium: "10% extra" },
  { feature: "Returns", basic: "7 days", plus: "30 days", premium: "60 days" },
  { feature: "Support", basic: "Standard", plus: "Priority", premium: "Dedicated" },
  { feature: "Early Access", basic: "—", plus: "✓", premium: "✓" },
  { feature: "Bonus Points", basic: "—", plus: "Monthly", premium: "Double" },
  { feature: "Birthday Rewards", basic: "—", plus: "—", premium: "✓" },
  { feature: "Member Events", basic: "—", plus: "—", premium: "✓" },
];

export default function MembershipPage() {
  const { membership } = useStore();
  const currentPlanId = membership?.planId || "basic";
  const [plans, setPlans] = useState(PLANS);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    getMembershipPlans().then((data) => {
      if (data && data.length > 0) {
        setPlans(data.map((p: any, i: number) => ({
          ...PLANS[i] || PLANS[0],
          id: p.id,
          name: p.name,
          price: p.price,
          period: p.billingCycle || "YEARLY",
        })));
      }
    }).catch(() => {});
  }, []);

  const handleSubscribe = useCallback(async (planId: string) => {
    try {
      await subscribeMembership(planId);
      alert("Successfully subscribed!");
    } catch (e: any) {
      alert(e.message || "Failed to subscribe");
    }
  }, []);

  const handleShareReferral = useCallback(async () => {
    try {
      const result = await getReferralCode();
      setReferralCode(result.code);
      if (navigator.share) {
        navigator.share({ title: "Join LVIGS Mart", text: `Use my referral code: ${result.code}`, url: window.location.href });
      } else {
        navigator.clipboard.writeText(result.code);
        alert(`Referral code ${result.code} copied!`);
      }
    } catch {
      alert("Please login to get a referral code");
    }
  }, []);

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <nav className="mb-4 flex items-center gap-2 text-xs text-ink-500">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-ink-900 dark:text-white">Membership</span>
        </nav>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Membership Plans</h1>
          <p className="mt-1 text-sm text-ink-500">Unlock exclusive benefits and save more</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlanId === plan.id;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition",
                  plan.color,
                  isCurrent && "ring-2 ring-brand-500"
                )}
              >
                <CardBody>
                  {isCurrent && (
                    <Badge tone="brand" className="absolute right-3 top-3">Current</Badge>
                  )}
                  {!isCurrent && plan.badge && (
                    <Badge tone={plan.badgeTone} className="absolute right-3 top-3">{plan.badge}</Badge>
                  )}
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    plan.id === "basic" && "bg-ink-100 text-ink-600 dark:bg-ink-700",
                    plan.id === "plus" && "bg-brand-100 text-brand-600 dark:bg-brand-950/50",
                    plan.id === "premium" && "bg-amber-100 text-amber-600 dark:bg-amber-950/50"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span className="text-2xl font-extrabold">Free</span>
                    ) : (
                      <>
                        <span className="text-2xl font-extrabold">{formatINR(plan.price)}</span>
                        <span className="text-sm text-ink-500">/{plan.period === "YEARLY" ? "year" : "month"}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{f}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-sm text-ink-400">
                        <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-ink-300">—</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    {isCurrent ? (
                      <Button block variant="secondary" disabled>
                        Current Plan
                      </Button>
                    ) : plan.price === 0 ? (
                      <Button block variant="secondary" disabled>
                        Default Plan
                      </Button>
                    ) : (
                      <Button block onClick={() => handleSubscribe(plan.id)}>
                        Subscribe — {plan.price === 0 ? "Free" : formatINR(plan.price) + "/yr"}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold">Feature Comparison</h2>
          <div className="overflow-hidden rounded-xl border bg-white dark:border-ink-700 dark:bg-ink-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-ink-50 text-left dark:border-ink-700 dark:bg-ink-800">
                  <th className="px-4 py-3 font-semibold">Feature</th>
                  <th className="px-4 py-3 font-semibold">Basic</th>
                  <th className="px-4 py-3 font-semibold text-brand-600">Plus</th>
                  <th className="px-4 py-3 font-semibold text-amber-600">Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b last:border-0 dark:border-ink-700">
                    <td className="px-4 py-3 font-medium">{row.feature}</td>
                    <td className="px-4 py-3 text-ink-500">{row.basic}</td>
                    <td className="px-4 py-3 font-medium">{row.plus}</td>
                    <td className="px-4 py-3 font-medium">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Refer & Earn</h3>
              <p className="text-sm opacity-80">Invite friends and earn 150 loyalty points for each referral</p>
            </div>
          </div>
          <Button className="mt-4" variant="dark" onClick={handleShareReferral}>
            Share referral link
          </Button>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
