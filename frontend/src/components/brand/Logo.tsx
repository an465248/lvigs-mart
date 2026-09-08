import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  variant?: "full" | "compact" | "mark";
  theme?: "light" | "dark" | "auto";
}

export function Logo({ className, variant = "full", theme = "auto" }: LogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src="/logo.png"
        alt="LVIGS Mart"
        width={36}
        height={36}
        className={cn("h-9 w-9 object-contain", className)}
        priority
      />
    );
  }

  if (variant === "compact") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <Logo variant="mark" />
        <span className="font-display text-lg font-bold tracking-tight">LVIGS</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo variant="mark" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-brand-700 dark:text-brand-300">
          LVIGS Mart
        </span>
        <span className="text-[10px] sm:text-xs font-medium text-ink-500 dark:text-ink-400">
          India&apos;s trusted marketplace
        </span>
      </span>
    </span>
  );
}

export function LogoStrip({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-hidden>
      <span className="h-1 w-1 rounded-full bg-accent-500" />
      <span className="h-1 w-1 rounded-full bg-brand-500" />
      <span className="h-1 w-1 rounded-full bg-accent-500" />
    </div>
  );
}