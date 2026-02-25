import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWindowSize } from "./use-window-size";

describe("useWindowSize", () => {
  let resizeHandler: (() => void) | null;
  let mockViewport: {
    width: number;
    height: number;
    offsetTop: number;
    offsetLeft: number;
    scale: number;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    resizeHandler = null;

    mockViewport = {
      width: 1024,
      height: 768,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 1,
      addEventListener: vi.fn((_event: string, handler: () => void) => {
        resizeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, "visualViewport", {
      value: mockViewport,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("when throttle fires, then returns initial viewport dimensions", () => {
    const { result } = renderHook(() => useWindowSize());

    // The throttled callback uses trailing: true by default, so advance timers
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
    expect(result.current.offsetTop).toBe(0);
    expect(result.current.offsetLeft).toBe(0);
    expect(result.current.scale).toBe(1);
  });

  it("when visualViewport resize event fires, then updates dimensions", () => {
    const { result } = renderHook(() => useWindowSize());

    // Let initial read flush
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.width).toBe(1024);

    // Simulate viewport resize
    mockViewport.width = 800;
    mockViewport.height = 600;

    act(() => {
      resizeHandler?.();
      vi.advanceTimersByTime(250);
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
  });

  it("when values are unchanged after resize, then does not update state", () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      vi.advanceTimersByTime(250);
    });

    const firstState = result.current;

    // Fire resize with same values
    act(() => {
      resizeHandler?.();
      vi.advanceTimersByTime(250);
    });

    // Should be the exact same object reference (state did not change)
    expect(result.current).toBe(firstState);
  });
});
