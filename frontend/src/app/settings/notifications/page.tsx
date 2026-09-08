"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Bell, Save } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

const CATEGORIES = [
  { key: "ORDER", label: "Order Updates", desc: "Order status, delivery tracking" },
  { key: "OFFER", label: "Offers & Promotions", desc: "Sales, coupons, discounts" },
  { key: "PRICE", label: "Price Alerts", desc: "Price drops on wishlisted items" },
  { key: "STOCK", label: "Stock Alerts", desc: "Back-in-stock notifications" },
  { key: "ACCOUNT", label: "Account", desc: "Security, profile updates" },
  { key: "SYSTEM", label: "System", desc: "App updates, maintenance" },
] as const;

export default function NotificationSettingsPage() {
  const toast = useToast();
  const [prefs, setPrefs] = useState(() => {
    const initial: Record<string, { push: boolean; email: boolean; sms: boolean }> = {};
    CATEGORIES.forEach((c) => {
      initial[c.key] = {
        push: c.key !== "SYSTEM",
        email: c.key === "ORDER" || c.key === "OFFER",
        sms: c.key === "ORDER",
      };
    });
    return initial;
  });

  const updatePref = (category: string, channel: "push" | "email" | "sms", value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      [category]: { ...prev[category], [channel]: value },
    }));
  };

  const save = () => {
    toast.push("Notification preferences saved!", "success");
  };

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <nav className="mb-4 flex items-center gap-2 text-xs text-ink-500">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/settings" className="hover:text-brand-600">Settings</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-ink-900 dark:text-white">Notifications</span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/50">
            <Bell className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Notification Preferences</h1>
            <p className="text-sm text-ink-500">Choose how you want to be notified</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white dark:border-ink-700 dark:bg-ink-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ink-50 text-left dark:border-ink-700 dark:bg-ink-800">
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 text-center font-semibold">Push</th>
                <th className="px-4 py-3 text-center font-semibold">Email</th>
                <th className="px-4 py-3 text-center font-semibold">SMS</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                <tr key={cat.key} className="border-b last:border-0 dark:border-ink-700">
                  <td className="px-4 py-3">
                    <p className="font-medium">{cat.label}</p>
                    <p className="text-xs text-ink-500">{cat.desc}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <Toggle
                        checked={prefs[cat.key]?.push ?? true}
                        onChange={(v) => updatePref(cat.key, "push", v)}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <Toggle
                        checked={prefs[cat.key]?.email ?? false}
                        onChange={(v) => updatePref(cat.key, "email", v)}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <Toggle
                        checked={prefs[cat.key]?.sms ?? false}
                        onChange={(v) => updatePref(cat.key, "sms", v)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={save}>
            <Save className="h-4 w-4" /> Save Preferences
          </Button>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
