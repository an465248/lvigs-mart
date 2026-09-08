"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TrendingUp, History, X, Tag, Search } from "lucide-react";
import { mockApi } from "@/lib/api";
import type { SearchSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SearchPanel({
  query,
  onPick,
  onClose,
}: {
  query: string;
  onPick: (q: string) => void;
  onClose: () => void;
}) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecent(mockApi.getRecentSearches());
    mockApi.getTrendingSearches().then(setTrending);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const result = await mockApi.getSuggestions(query);
      setSuggestions(result);
    }, 120);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const clearRecent = () => {
    mockApi.clearRecentSearches();
    setRecent([]);
  };

  return (
    <div className="absolute left-0 right-0 top-12 z-50 rounded-xl border bg-white shadow-pop dark:border-ink-700 dark:bg-ink-800 animate-fade-in" onMouseLeave={onClose}>
      <div className="p-4">
        {query.trim().length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-500">
                <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Recent searches</span>
                {recent.length > 0 && (
                  <button onClick={clearRecent} className="text-ink-500 hover:text-rose-600">Clear all</button>
                )}
              </div>
              {recent.length === 0 ? (
                <p className="text-xs text-ink-400">No recent searches.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => onPick(r)}
                      className="rounded-full border px-3 py-1 text-xs hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-700"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold text-ink-500 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Trending now
              </div>
              <div className="flex flex-wrap gap-2">
                {trending.map((t) => (
                  <button
                    key={t}
                    onClick={() => onPick(t)}
                    className="rounded-full bg-ink-100 px-3 py-1 text-xs hover:bg-ink-200 dark:bg-ink-700 dark:hover:bg-ink-600"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {suggestions.length === 0 ? (
              <div className="flex items-center gap-2 px-2 py-3 text-sm text-ink-500">
                <Search className="h-4 w-4" /> No suggestions found for "{query}"
              </div>
            ) : (
              suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onPick(s.text)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-ink-50 dark:hover:bg-ink-700"
                >
                  <div className="flex items-center gap-2">
                    {s.type === "PRODUCT" && <Tag className="h-4 w-4 text-brand-500" />}
                    {s.type === "CATEGORY" && <Tag className="h-4 w-4 text-accent-500" />}
                    {s.type === "BRAND" && <Tag className="h-4 w-4 text-emerald-500" />}
                    {s.type === "QUERY" && <Search className="h-4 w-4 text-ink-400" />}
                    <span>{s.text}</span>
                  </div>
                  <span className="text-xs text-ink-400">{s.type.toLowerCase()}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}