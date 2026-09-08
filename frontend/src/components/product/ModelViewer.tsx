"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Box, RotateCcw, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelViewerProps {
  imageUrl: string;
  productName: string;
  autoRotate?: boolean;
  className?: string;
}

export function ModelViewer({ imageUrl, productName, autoRotate = true, className }: ModelViewerProps) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const [loaded, setLoaded] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAutoRotating) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    let last = performance.now();
    const animate = (now: number) => {
      const delta = now - last;
      last = now;
      setRotation((prev) => (prev + delta * 0.02) % 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isAutoRotating]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 dark:from-ink-800 dark:to-ink-700", className)}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      )}

      <div
        className="relative aspect-square w-full cursor-grab active:cursor-grabbing"
        style={{ perspective: "800px" }}
        onClick={() => setIsAutoRotating(!isAutoRotating)}
      >
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `rotateY(${rotation}deg) scale(${scale})`,
            transformStyle: "preserve-3d",
          }}
        >
          <Image
            src={imageUrl}
            alt={productName}
            width={400}
            height={400}
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
            unoptimized
            onLoad={() => setLoaded(true)}
          />
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
            <Box className="h-3 w-3" />
            {isAutoRotating ? "Tap to stop" : "Tap to rotate"}
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScale((s) => Math.min(2, s + 0.2));
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 shadow-sm dark:bg-ink-800/90"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScale((s) => Math.max(0.5, s - 0.2));
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 shadow-sm dark:bg-ink-800/90"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRotation(0);
                setScale(1);
                setIsAutoRotating(autoRotate);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 shadow-sm dark:bg-ink-800/90"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
