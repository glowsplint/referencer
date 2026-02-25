import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsBreakpoint } from "./use-is-breakpoint";

let mockMatchMediaListeners: Map<string, (e: MediaQueryListEvent) => void>;
let mockMatchMediaResults: Map<string, boolean>;

beforeEach(() => {
  vi.clearAllMocks();
  mockMatchMediaListeners = new Map();
  mockMatchMediaResults = new Map();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => {
      const matches = mockMatchMediaResults.get(query) ?? false;
      return {
        matches,
        media: query,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === "change") {
            mockMatchMediaListeners.set(query, listener);
          }
        }),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
});

describe("useIsBreakpoint", () => {
  describe("when using default max mode at 768px", () => {
    it("returns false when viewport is wider", () => {
      mockMatchMediaResults.set("(max-width: 767px)", false);
      const { result } = renderHook(() => useIsBreakpoint());
      expect(result.current).toBe(false);
    });

    it("returns true when viewport matches", () => {
      mockMatchMediaResults.set("(max-width: 767px)", true);
      const { result } = renderHook(() => useIsBreakpoint());
      expect(result.current).toBe(true);
    });
  });

  describe("when using min mode", () => {
    it("constructs the correct media query", () => {
      mockMatchMediaResults.set("(min-width: 1024px)", true);
      const { result } = renderHook(() => useIsBreakpoint("min", 1024));
      expect(result.current).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 1024px)");
    });

    it("returns false when viewport is narrower", () => {
      mockMatchMediaResults.set("(min-width: 1024px)", false);
      const { result } = renderHook(() => useIsBreakpoint("min", 1024));
      expect(result.current).toBe(false);
    });
  });

  describe("when the media query changes", () => {
    it("updates the returned value", () => {
      mockMatchMediaResults.set("(max-width: 767px)", false);
      const { result } = renderHook(() => useIsBreakpoint("max", 768));

      expect(result.current).toBe(false);

      // Simulate the media query changing
      const listener = mockMatchMediaListeners.get("(max-width: 767px)");
      if (listener) {
        act(() => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      }

      expect(result.current).toBe(true);
    });
  });

  describe("when breakpoint parameter changes", () => {
    it("re-evaluates with the new breakpoint", () => {
      mockMatchMediaResults.set("(max-width: 767px)", true);
      mockMatchMediaResults.set("(max-width: 1023px)", false);

      const { result, rerender } = renderHook(({ bp }) => useIsBreakpoint("max", bp), {
        initialProps: { bp: 768 },
      });

      expect(result.current).toBe(true);

      rerender({ bp: 1024 });
      expect(result.current).toBe(false);
    });
  });
});
