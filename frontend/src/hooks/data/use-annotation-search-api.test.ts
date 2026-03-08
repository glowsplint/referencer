import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnnotationSearchApi } from "./use-annotation-search-api";

vi.mock("@/lib/search-client", () => ({
  searchAnnotations: vi.fn(),
}));

import { searchAnnotations } from "@/lib/search-client";

const mockSearchAnnotations = vi.mocked(searchAnnotations);

describe("useAnnotationSearchApi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSearchAnnotations.mockReset();
    mockSearchAnnotations.mockResolvedValue({ results: [], total: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty results for query shorter than 2 chars", () => {
    const { result } = renderHook(() => useAnnotationSearchApi("a"));
    expect(result.current.results).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it("debounces the API call", async () => {
    const { result } = renderHook(() => useAnnotationSearchApi("hello", 300));

    // Should be loading immediately
    expect(result.current.isLoading).toBe(true);

    // API should not have been called yet
    expect(mockSearchAnnotations).not.toHaveBeenCalled();

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockSearchAnnotations).toHaveBeenCalledWith("hello");
  });

  it("returns results after successful API call", async () => {
    const mockResults = {
      results: [
        {
          annotation_id: "a1",
          document_id: "d1",
          document_title: "Doc 1",
          layer_id: "l1",
          layer_name: "Layer",
          annotation_type: "highlight" as const,
          selected_text: "hello",
          annotation_text: "",
          reply_texts: "",
          user_name: "User",
          rank: 1,
        },
      ],
      total: 1,
    };
    mockSearchAnnotations.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useAnnotationSearchApi("hello", 0));

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.results).toEqual(mockResults.results);
    expect(result.current.total).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("handles API errors", async () => {
    mockSearchAnnotations.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAnnotationSearchApi("hello", 0));

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.results).toEqual([]);
  });

  it("clears results when query becomes too short", async () => {
    mockSearchAnnotations.mockResolvedValue({
      results: [{ annotation_id: "a1" }],
      total: 1,
    } as any);

    const { result, rerender } = renderHook(({ query }) => useAnnotationSearchApi(query, 0), {
      initialProps: { query: "hello" },
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.results).toHaveLength(1);

    rerender({ query: "h" });

    expect(result.current.results).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });
});
