import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUnmount } from "./use-unmount";

describe("useUnmount", () => {
  it("calls callback when component unmounts", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useUnmount(callback));

    expect(callback).not.toHaveBeenCalled();

    unmount();
    expect(callback).toHaveBeenCalledOnce();
  });

  it("always calls the latest callback version, not a stale closure", () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    const { rerender, unmount } = renderHook(
      ({ cb }) => useUnmount(cb),
      { initialProps: { cb: firstCallback } },
    );

    // Update callback
    rerender({ cb: secondCallback });

    unmount();

    // Should call the latest version, not the first
    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
  });
});
