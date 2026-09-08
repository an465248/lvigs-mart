"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useStore } from "@/state/store";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/types";

export function LanguageSwitcher() {
  const { locale, setLocale } = useStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-ink-50 p-0.5 dark:border-ink-700 dark:bg-ink-800">
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition",
          locale === "en"
            ? "bg-white text-brand-600 shadow-soft dark:bg-ink-700 dark:text-brand-300"
            : "text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
        )}
      >
        <Globe className="h-3 w-3" />
        EN
      </button>
      <button
        onClick={() => setLocale("hi")}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition",
          locale === "hi"
            ? "bg-white text-brand-600 shadow-soft dark:bg-ink-700 dark:text-brand-300"
            : "text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
        )}
      >
        <Globe className="h-3 w-3" />
        हिं
      </button>
    </div>
  );
}
