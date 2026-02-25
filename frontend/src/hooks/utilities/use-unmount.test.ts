import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUnmount } from "./use-unmount";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useUnmount", () => {
  describe("when the component unmounts", () => {
    it("calls the callback", () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useUnmount(callback));

      expect(callback).not.toHaveBeenCalled();
      unmount();
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe("when the callback changes", () => {
    it("calls the latest version on unmount", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { unmount, rerender } = renderHook(({ cb }) => useUnmount(cb), {
        initialProps: { cb: callback1 },
      });

      rerender({ cb: callback2 });
      unmount();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledOnce();
    });
  });

  describe("when the component re-renders without unmounting", () => {
    it("does not call the callback", () => {
      const callback = vi.fn();
      const { rerender } = renderHook(() => useUnmount(callback));

      rerender();
      rerender();

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
