"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { mockApi } from "@/lib/api";
import { relativeTime } from "@/lib/utils";
import type { NotificationItem } from "@/lib/types";
import { Bell, Package, Tag, TrendingUp, Sparkles, User, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, any> = { ORDER: Package, OFFER: Tag, PRICE: TrendingUp, STOCK: Sparkles, ACCOUNT: User, SYSTEM: Info };

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  useEffect(() => { setItems(mockApi.getNotifications()); }, []);
  useEffect(() => {
    const handler = () => setItems(mockApi.getNotifications());
    window.addEventListener("lvigs:notifications-change", handler);
    return () => window.removeEventListener("lvigs:notifications-change", handler);
  }, []);

  const handleMarkAllRead = () => { mockApi.markAllNotificationsRead(); setItems(mockApi.getNotifications()); };

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Notifications</h1>
          {items.some((n) => !n.read) && (
            <button onClick={handleMarkAllRead} className="text-sm font-semibold text-brand-600 hover:text-brand-700">Mark all read</button>
          )}
        </div>
        {items.length === 0 ? (
          <EmptyState icon={<Bell className="h-8 w-8" />} title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const Icon = typeIcons[n.type] || Info;
              return (
                <div key={n.id} className={cn("card-base flex gap-3 p-4 transition hover:shadow-card", !n.read && "border-l-4 border-brand-500")}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <p className="text-sm text-ink-500 line-clamp-2">{n.body}</p>
                    <p className="mt-1 text-xs text-ink-400">{relativeTime(n.at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}