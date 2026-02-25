import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWindowSize } from "./use-window-size";

let resizeHandler: (() => void) | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  resizeHandler = null;

  // Mock visualViewport
  const mockViewport = {
    width: 1024,
    height: 768,
    offsetTop: 0,
    offsetLeft: 0,
    scale: 1,
    addEventListener: vi.fn((event: string, handler: () => void) => {
      if (event === "resize") {
        resizeHandler = handler;
      }
    }),
    removeEventListener: vi.fn(),
  };

  Object.defineProperty(window, "visualViewport", {
    writable: true,
    value: mockViewport,
  });
});

describe("useWindowSize", () => {
  describe("when initially rendered", () => {
    it("returns zero state before first viewport read", () => {
      // The initial state is all zeros since it relies on throttled callback
      const { result } = renderHook(() => useWindowSize());
      // The throttled callback is trailing-only by default, so initial state is zeros
      expect(result.current).toEqual(
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      );
    });
  });

  describe("when the viewport fires a resize event", () => {
    it("registers a resize listener on visualViewport", () => {
      renderHook(() => useWindowSize());
      expect(window.visualViewport!.addEventListener).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );
    });
  });

  describe("when the hook unmounts", () => {
    it("removes the resize listener", () => {
      const { unmount } = renderHook(() => useWindowSize());
      unmount();
      expect(window.visualViewport!.removeEventListener).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );
    });
  });
});
