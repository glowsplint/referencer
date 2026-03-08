import { useState, useEffect, useRef } from "react";
import { searchAnnotations, type SearchResult } from "@/lib/search-client";

export function useAnnotationSearchApi(
  query: string,
  debounceMs = 300,
): {
  results: SearchResult[];
  total: number;
  isLoading: boolean;
  error: Error | null;
} {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setTotal(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await searchAnnotations(trimmed);
        if (!controller.signal.aborted) {
          setResults(response.results);
          setTotal(response.total);
          setError(null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setResults([]);
          setTotal(0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [query, debounceMs]);

  return { results, total, isLoading, error };
}
