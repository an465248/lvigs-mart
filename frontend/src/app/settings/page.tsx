"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTheme } from "next-themes";
import { Moon, Sun, Globe, Bell, Shield, HelpCircle } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-900">
      <Header />
      <main className="container-page pb-24 pt-4 lg:pb-12">
        <h1 className="text-xl font-bold mb-4">Settings</h1>
        <div className="card-base divide-y dark:divide-ink-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="h-5 w-5 text-ink-500" /> : <Sun className="h-5 w-5 text-ink-500" />}
              <span className="font-medium text-sm">Dark Mode</span>
            </div>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className={`relative h-6 w-11 rounded-full transition ${theme === "dark" ? "bg-brand-600" : "bg-ink-300"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${theme === "dark" ? "left-5.5" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-ink-500" /><span className="font-medium text-sm">Language</span></div>
            <span className="text-sm text-ink-500">English</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-ink-500" /><span className="font-medium text-sm">Push Notifications</span></div>
            <button className="relative h-6 w-11 rounded-full bg-brand-600"><span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white" /></button>
          </div>
          <a href="/terms" className="flex items-center justify-between p-4 hover:bg-ink-50 dark:hover:bg-ink-700">
            <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-ink-500" /><span className="font-medium text-sm">Terms & Privacy</span></div>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}