"use client";

import { useEffect } from "react";

export function initSentry() {
  if (typeof window === "undefined") return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  // Sentry Next.js integration would go here
  // For now, just log that it would be configured
  if (process.env.NODE_ENV === "development") {
    console.log("[Sentry] DSN configured, would initialize in production");
  }
}

export function SentryErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSentry();
  }, []);
  return <>{children}</>;
}
