"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ImageSearchProps {
  onResult: (imageUrl: string) => void;
  className?: string;
}

type ImageSearchState = "idle" | "preview" | "uploading" | "error";

export function ImageSearch({ onResult, className }: ImageSearchProps) {
  const [state, setState] = useState<ImageSearchState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      setState("error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setState("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(() => {
    if (!preview) return;
    setState("uploading");
    setTimeout(() => {
      onResult(preview);
      setState("idle");
      setPreview(null);
    }, 1200);
  }, [preview, onResult]);

  const reset = useCallback(() => {
    setState("idle");
    setPreview(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="hidden h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-white dark:hover:bg-ink-700 sm:inline-flex"
        aria-label="Image search"
      >
        <Camera className="h-4 w-4" />
      </button>

      {state === "preview" && preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={reset}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-pop dark:bg-ink-800 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Image Search</h3>
              <button onClick={reset} className="rounded-lg p-1 hover:bg-ink-100 dark:hover:bg-ink-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-ink-50 dark:bg-ink-700">
              <Image src={preview} alt="Search preview" fill className="object-contain" unoptimized />
            </div>
            <p className="mt-2 text-center text-xs text-ink-500">
              Search for products similar to this image
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={reset}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleUpload}>
                <Camera className="h-4 w-4" /> Search
              </Button>
            </div>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-pop dark:bg-ink-800 animate-scale-in">
            <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
            <p className="text-sm font-medium">Searching...</p>
          </div>
        </div>
      )}

      {state === "error" && error && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-pop dark:border-amber-900 dark:bg-amber-950/40 animate-scale-in">
          <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
          <button onClick={reset} className="mt-2 text-xs font-semibold text-amber-600">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
