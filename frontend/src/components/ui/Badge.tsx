"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "brand" | "accent" | "success" | "warning" | "danger" | "muted";
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  brand: "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
  accent: "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  muted: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
};

export function Badge({ className, tone = "default", children, ...rest }: BadgeProps) {
  return (
    <span className={cn("chip", toneClasses[tone], className)} {...rest}>
      {children}
    </span>
  );
}