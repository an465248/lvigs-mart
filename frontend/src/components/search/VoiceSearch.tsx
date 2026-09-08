"use client";

import React, { useCallback, useRef, useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  className?: string;
}

type VoiceState = "idle" | "listening" | "processing" | "error";

export function VoiceSearch({ onResult, className }: VoiceSearchProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    setError("");
    setTranscript("");

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setError("Voice search is not supported in this browser");
      setState("error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) {
        setState("processing");
        onResult(finalTranscript.trim());
        setTimeout(() => {
          setState("idle");
          setTranscript("");
        }, 500);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else if (event.error === "audio-capture") {
        setError("No microphone found. Please check your device.");
      } else if (event.error === "not-allowed") {
        setError("Microphone permission denied. Please allow access.");
      } else {
        setError("Voice search failed. Please try again.");
      }
      setState("error");
    };

    recognition.onend = () => {
      if (state === "listening") {
        setState("idle");
      }
    };

    recognition.start();
  }, [onResult, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState("idle");
    setTranscript("");
  }, []);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={state === "listening" ? stopListening : startListening}
        className={cn(
          "h-9 w-9 items-center justify-center rounded-lg transition",
          state === "listening"
            ? "flex animate-pulse bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
            : "hidden sm:inline-flex text-ink-500 hover:bg-white dark:hover:bg-ink-700"
        )}
        aria-label="Voice search"
      >
        {state === "listening" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>

      {state === "listening" && (
        <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-xl border bg-white p-4 shadow-pop dark:border-ink-700 dark:bg-ink-800 animate-scale-in">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-950/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Mic className="h-6 w-6 text-rose-600 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-rose-400 animate-ping opacity-20" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Listening...</p>
              {transcript && (
                <p className="mt-1 max-w-[200px] truncate text-xs text-ink-500">{transcript}</p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={stopListening}>
              <X className="h-3 w-3" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {state === "error" && error && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-rose-200 bg-rose-50 p-3 shadow-pop dark:border-rose-900 dark:bg-rose-950/40 animate-scale-in">
          <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
          <button onClick={() => setState("idle")} className="mt-2 text-xs font-semibold text-rose-600">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
