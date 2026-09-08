"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScanBarcode, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface BarcodeSearchProps {
  onResult: (barcode: string) => void;
  className?: string;
}

type BarcodeState = "idle" | "scanning" | "found" | "notfound" | "error";

export function BarcodeSearch({ onResult, className }: BarcodeSearchProps) {
  const [state, setState] = useState<BarcodeState>("idle");
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const startScanning = useCallback(async () => {
    if (!isSupported) {
      setError("Barcode scanning is not supported on this device");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      detectorRef.current = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
      });

      setState("scanning");
      scanFrame();
    } catch {
      setError("Camera access denied. Please allow camera permission.");
      setState("error");
    }
  }, [isSupported]);

  const scanFrame = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current) return;

    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        setBarcode(code);
        setState("found");
        stopScanning();
        onResult(code);
        return;
      }
    } catch {}

    if (state === "scanning") {
      requestAnimationFrame(scanFrame);
    }
  }, [state, onResult]);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    detectorRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopScanning();
  }, [stopScanning]);

  const reset = useCallback(() => {
    stopScanning();
    setState("idle");
    setBarcode("");
    setError("");
  }, [stopScanning]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={state === "scanning" ? reset : startScanning}
        className={cn(
          "h-9 w-9 items-center justify-center rounded-lg transition",
          state === "scanning"
            ? "flex bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
            : "hidden sm:inline-flex text-ink-500 hover:bg-white dark:hover:bg-ink-700"
        )}
        aria-label="Scan barcode"
      >
        <ScanBarcode className="h-4 w-4" />
      </button>

      {state === "scanning" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
          <div className="relative w-full max-w-sm">
            <video ref={videoRef} className="w-full rounded-2xl" playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-64 rounded-lg border-2 border-brand-500">
                <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-brand-500 rounded-tl-lg" />
                <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-brand-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-brand-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-brand-500 rounded-br-lg" />
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-brand-500/50 animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-sm font-medium text-white">Point camera at barcode</p>
            </div>
            <button
              onClick={reset}
              className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-pop"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-pop dark:border-amber-900 dark:bg-amber-950/40 animate-scale-in">
          <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
          <div className="mt-2 flex gap-2">
            <button onClick={reset} className="text-xs font-semibold text-amber-600">
              Dismiss
            </button>
            <button onClick={startScanning} className="text-xs font-semibold text-brand-600">
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
