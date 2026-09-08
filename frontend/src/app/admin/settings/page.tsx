"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Bot, Settings, Shield, Bell, Award, Users, ToggleLeft, ToggleRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { getFeatureFlags, setFeatureFlag } from "@/lib/api-phase6";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-600"
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

export default function AdminSettingsPage() {
  const toast = useToast();
  const [config, setConfig] = useState({
    aiProvider: "openai",
    aiApiKeyConfigured: true,
    recommendationEnabled: true,
    loyaltyEnabled: true,
    membershipEnabled: true,
    fraudDetectionEnabled: true,
    fraudThreshold: 5000,
    emailNotifications: true,
    pushNotifications: true,
  });

  useEffect(() => {
    getFeatureFlags().then((flags) => {
      setConfig((prev) => ({
        ...prev,
        recommendationEnabled: flags.recommendations ?? true,
        loyaltyEnabled: flags.loyalty ?? true,
        membershipEnabled: flags.membership ?? true,
        fraudDetectionEnabled: flags.fraud_detection ?? true,
      }));
    }).catch(() => {});
  }, []);

  const updateConfig = (key: string, value: boolean | string | number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = useCallback(async () => {
    try {
      await Promise.all([
        setFeatureFlag("recommendations", config.recommendationEnabled),
        setFeatureFlag("loyalty", config.loyaltyEnabled),
        setFeatureFlag("membership", config.membershipEnabled),
        setFeatureFlag("fraud_detection", config.fraudDetectionEnabled),
      ]);
      toast.push("Settings saved successfully!", "success");
    } catch {
      toast.push("Failed to save settings", "error");
    }
  }, [config, toast]);

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <nav className="mb-4 flex items-center gap-2 text-xs text-ink-500">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin" className="hover:text-brand-600">Admin</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-ink-900 dark:text-white">AI & Settings</span>
        </nav>

        <h1 className="mb-6 text-2xl font-extrabold">Admin AI Controls</h1>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-brand-600" /> AI Provider Configuration
              </CardTitle>
              <Badge tone={config.aiApiKeyConfigured ? "success" : "warning"}>
                {config.aiApiKeyConfigured ? "Configured" : "Not Configured"}
              </Badge>
            </CardHeader>
            <CardBody className="space-y-3">
              <Input
                label="AI Provider"
                value={config.aiProvider}
                onChange={(e) => updateConfig("aiProvider", e.target.value)}
              />
              <Input
                label="API Endpoint"
                placeholder="https://api.openai.com/v1"
                defaultValue="https://api.openai.com/v1"
              />
              <Input
                label="API Key"
                type="password"
                placeholder="sk-..."
                defaultValue="sk-••••••••••••••••"
              />
              <p className="text-xs text-ink-500">Configure the AI provider used for product recommendations, search, and assistant features.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-brand-600" /> Recommendation Engine
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Recommendations</p>
                  <p className="text-xs text-ink-500">Show personalized product suggestions</p>
                </div>
                <Toggle
                  checked={config.recommendationEnabled}
                  onChange={(v) => updateConfig("recommendationEnabled", v)}
                />
              </div>
              <div className="h-px bg-ink-100 dark:bg-ink-700" />
              <Input label="Max recommendations per section" type="number" defaultValue="8" />
              <Input label="Cache TTL (seconds)" type="number" defaultValue="300" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-brand-600" /> Loyalty Rules
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Loyalty Program</p>
                  <p className="text-xs text-ink-500">Allow customers to earn and redeem points</p>
                </div>
                <Toggle
                  checked={config.loyaltyEnabled}
                  onChange={(v) => updateConfig("loyaltyEnabled", v)}
                />
              </div>
              <div className="h-px bg-ink-100 dark:bg-ink-700" />
              <Input label="Points per ₹10 spent" type="number" defaultValue="1" />
              <Input label="Review bonus points" type="number" defaultValue="50" />
              <Input label="Referral bonus points" type="number" defaultValue="150" />
              <Input label="Points expiry (days)" type="number" defaultValue="90" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-600" /> Membership Plans
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Membership</p>
                  <p className="text-xs text-ink-500">Offer subscription-based membership tiers</p>
                </div>
                <Toggle
                  checked={config.membershipEnabled}
                  onChange={(v) => updateConfig("membershipEnabled", v)}
                />
              </div>
              <div className="h-px bg-ink-100 dark:bg-ink-700" />
              <div className="space-y-2">
                {[
                  { name: "Basic", price: "Free", status: "Active" },
                  { name: "Plus", price: "₹499/yr", status: "Active" },
                  { name: "Premium", price: "₹1,499/yr", status: "Active" },
                ].map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 dark:bg-ink-700">
                    <div>
                      <p className="text-sm font-medium">{plan.name}</p>
                      <p className="text-xs text-ink-500">{plan.price}</p>
                    </div>
                    <Badge tone="success">{plan.status}</Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-600" /> Fraud Detection
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Fraud Detection</p>
                  <p className="text-xs text-ink-500">Automatically flag suspicious activity</p>
                </div>
                <Toggle
                  checked={config.fraudDetectionEnabled}
                  onChange={(v) => updateConfig("fraudDetectionEnabled", v)}
                />
              </div>
              <div className="h-px bg-ink-100 dark:bg-ink-700" />
              <Input
                label="Order value threshold (₹)"
                type="number"
                value={config.fraudThreshold}
                onChange={(e) => updateConfig("fraudThreshold", Number(e.target.value))}
              />
              <Input label="Max orders per hour" type="number" defaultValue="5" />
              <Input label="Max failed payments" type="number" defaultValue="3" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-brand-600" /> Notification Rules
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-ink-500">Send order and promotional emails</p>
                </div>
                <Toggle
                  checked={config.emailNotifications}
                  onChange={(v) => updateConfig("emailNotifications", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-ink-500">Send mobile push notifications</p>
                </div>
                <Toggle
                  checked={config.pushNotifications}
                  onChange={(v) => updateConfig("pushNotifications", v)}
                />
              </div>
              <div className="h-px bg-ink-100 dark:bg-ink-700" />
              <Input label="Price alert check interval (min)" type="number" defaultValue="60" />
              <Input label="Stock alert batch size" type="number" defaultValue="100" />
            </CardBody>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary">Reset Defaults</Button>
          <Button onClick={handleSave}>
            Save All Settings
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
