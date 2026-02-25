import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrolling } from "./use-scrolling";

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  // Remove onscrollend so the hook uses the debounce fallback path
  delete (window as any).onscrollend;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useScrolling", () => {
  describe("when initially rendered", () => {
    it("returns false", () => {
      const { result } = renderHook(() => useScrolling());
      expect(result.current).toBe(false);
    });
  });

  describe("when a scroll event fires on document", () => {
    it("returns true while scrolling", () => {
      const { result } = renderHook(() => useScrolling());

      act(() => {
        document.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      expect(result.current).toBe(true);
    });

    it("returns false after the debounce period", () => {
      const { result } = renderHook(() => useScrolling());

      act(() => {
        document.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(result.current).toBe(false);
    });
  });

  describe("when custom debounce is specified", () => {
    it("waits the custom duration before clearing", () => {
      const { result } = renderHook(() => useScrolling(undefined, { debounce: 300 }));

      act(() => {
        document.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current).toBe(false);
    });
  });

  describe("when target is a DOM element ref", () => {
    it("detects scrolling on the element", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const ref = { current: element };

      const { result } = renderHook(() => useScrolling(ref));

      act(() => {
        element.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current).toBe(false);
      element.remove();
    });
  });

  describe("when multiple scroll events fire rapidly", () => {
    it("resets the debounce timer on each scroll", () => {
      const { result } = renderHook(() => useScrolling());

      act(() => {
        document.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      expect(result.current).toBe(true);

      // Fire another scroll at 100ms (before debounce of 150ms)
      act(() => {
        vi.advanceTimersByTime(100);
        document.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      // At 200ms from start, still scrolling because the timer was reset
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current).toBe(true);

      // After the full debounce from last scroll
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current).toBe(false);
    });
  });

  describe("when unmounted", () => {
    it("cleans up event listeners", () => {
      const { result, unmount } = renderHook(() => useScrolling());

      act(() => {
        document.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      expect(result.current).toBe(true);

      unmount();

      // Scrolling after unmount should not cause issues
      act(() => {
        document.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
    });
  });
});
