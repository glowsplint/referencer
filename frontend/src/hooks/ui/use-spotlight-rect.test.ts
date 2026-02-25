import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSpotlightRect } from "./use-spotlight-rect";

let mockDisconnect: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockDisconnect = vi.fn();

  // Mock ResizeObserver as a class
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = mockDisconnect;
    constructor(_callback: ResizeObserverCallback) {}
  }
  vi.stubGlobal("ResizeObserver", MockResizeObserver);

  // Mock requestAnimationFrame
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});

describe("useSpotlightRect", () => {
  describe("when selector is null", () => {
    it("returns null", () => {
      const { result } = renderHook(() => useSpotlightRect(null));
      expect(result.current).toBeNull();
    });
  });

  describe("when selector matches no element", () => {
    it("returns null", () => {
      const { result } = renderHook(() => useSpotlightRect(".non-existent"));
      expect(result.current).toBeNull();
    });
  });

  describe("when selector matches an element", () => {
    it("returns a DOMRect with 8px padding", () => {
      const element = document.createElement("div");
      element.classList.add("spotlight-target");
      document.body.appendChild(element);

      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 200, 300, 400));

      const { result } = renderHook(() => useSpotlightRect(".spotlight-target"));

      expect(result.current).not.toBeNull();
      expect(result.current!.x).toBe(92); // 100 - 8
      expect(result.current!.y).toBe(192); // 200 - 8
      expect(result.current!.width).toBe(316); // 300 + 16
      expect(result.current!.height).toBe(416); // 400 + 16

      element.remove();
    });
  });

  describe("when selector changes from valid to null", () => {
    it("returns null", () => {
      const element = document.createElement("div");
      element.classList.add("spotlight-target2");
      document.body.appendChild(element);
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 20, 30, 40));

      const { result, rerender } = renderHook(({ sel }) => useSpotlightRect(sel), {
        initialProps: { sel: ".spotlight-target2" as string | null },
      });

      expect(result.current).not.toBeNull();

      rerender({ sel: null });
      expect(result.current).toBeNull();

      element.remove();
    });
  });

  describe("when cleanup happens", () => {
    it("disconnects the ResizeObserver", () => {
      const element = document.createElement("div");
      element.classList.add("cleanup-target");
      document.body.appendChild(element);
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 100));

      const { unmount } = renderHook(() => useSpotlightRect(".cleanup-target"));

      unmount();
      expect(mockDisconnect).toHaveBeenCalled();

      element.remove();
    });
  });
});
