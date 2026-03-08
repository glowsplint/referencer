import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTags } from "./use-tags";

vi.mock("@/lib/tag-client", () => ({
  fetchTags: vi.fn(),
  addTag: vi.fn(),
  removeTag: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { fetchTags, addTag, removeTag } from "@/lib/tag-client";
import { toast } from "sonner";

const mockFetch = vi.mocked(fetchTags);
const mockAdd = vi.mocked(addTag);
const mockRemove = vi.mocked(removeTag);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    allTags: ["grace", "covenant"],
    documentTags: {
      "doc-1": ["grace"],
      "doc-2": ["covenant"],
    },
  });
  mockAdd.mockResolvedValue(undefined);
  mockRemove.mockResolvedValue(undefined);
});

describe("useTags", () => {
  describe("when mounted", () => {
    it("then fetches tags and sets state", async () => {
      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allTags).toEqual(["grace", "covenant"]);
      expect(result.current.documentTags).toEqual({
        "doc-1": ["grace"],
        "doc-2": ["covenant"],
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("when addTag is called", () => {
    it("then optimistically adds the tag and calls API", async () => {
      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addTag("doc-1", "prophecy");
      });

      // Optimistic update
      expect(result.current.documentTags["doc-1"]).toContain("prophecy");
      expect(result.current.allTags).toContain("prophecy");

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith("doc-1", "prophecy");
      });
    });

    it("then rolls back and shows toast on API error", async () => {
      mockAdd.mockRejectedValue(new Error("fail"));
      // After error, silentRefetch will restore data
      mockFetch.mockResolvedValue({
        allTags: ["grace", "covenant"],
        documentTags: { "doc-1": ["grace"], "doc-2": ["covenant"] },
      });

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addTag("doc-1", "prophecy");
      });

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Failed to add tag");
      });
    });

    it("then does not add duplicate tags", async () => {
      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addTag("doc-1", "grace");
      });

      // Should not add duplicate
      expect(result.current.documentTags["doc-1"]).toEqual(["grace"]);
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it("then rejects invalid tags", async () => {
      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addTag("doc-1", "invalid tag!");
      });

      expect(mockAdd).not.toHaveBeenCalled();
    });
  });

  describe("when removeTag is called", () => {
    it("then optimistically removes the tag and calls API", async () => {
      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.removeTag("doc-1", "grace");
      });

      // Optimistic removal
      expect(result.current.documentTags["doc-1"]).toBeUndefined();

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith("doc-1", "grace");
      });
    });

    it("then rolls back and shows toast on API error", async () => {
      mockRemove.mockRejectedValue(new Error("fail"));

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.removeTag("doc-1", "grace");
      });

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Failed to remove tag");
      });
    });
  });
});
