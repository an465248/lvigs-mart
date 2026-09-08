"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Box, Maximize2, RotateCcw, Move3d } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ArViewerProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ArViewer({ images, productName, className }: ArViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setRotation((prev) => ({
      x: prev.x - dy * 0.5,
      y: prev.y + dx * 0.5,
    }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 dark:from-ink-800 dark:to-ink-700 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-100"
          style={{
            transform: `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          {images[0] && (
            <Image
              src={images[0]}
              alt={productName}
              width={400}
              height={400}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
              unoptimized
            />
          )}
        </div>

        <div className="absolute bottom-3 left-3 flex gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
            <Move3d className="h-3 w-3" /> Drag to rotate
          </div>
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            onClick={() => setRotation({ x: 0, y: 0 })}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 shadow-sm transition hover:bg-white dark:bg-ink-800/90"
            aria-label="Reset rotation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsExpanded(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 shadow-sm transition hover:bg-white dark:bg-ink-800/90"
            aria-label="Expand"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-8" onClick={() => setIsExpanded(false)}>
          <div
            className="relative h-full w-full max-w-2xl cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              className="flex h-full items-center justify-center transition-transform duration-100"
              style={{
                transform: `perspective(1200px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              }}
            >
              {images[0] && (
                <Image
                  src={images[0]}
                  alt={productName}
                  width={800}
                  height={800}
                  className="max-h-full max-w-full object-contain select-none"
                  draggable={false}
                  unoptimized
                />
              )}
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-pop"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
