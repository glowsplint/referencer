import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useThrottledCallback } from "./use-throttled-callback";

describe("useThrottledCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("when called rapidly, then throttles to the specified wait time", () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(fn, 200, []),
    );

    // Call multiple times rapidly
    result.current();
    result.current();
    result.current();

    // Default options: leading=false, trailing=true
    // So the function should not have been called yet
    expect(fn).not.toHaveBeenCalled();

    // Advance past the throttle window
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("when leading=true, then calls immediately on first invocation", () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(fn, 200, [], { leading: true, trailing: true }),
    );

    result.current();
    expect(fn).toHaveBeenCalledOnce();

    // Subsequent calls within the window are throttled
    result.current();
    result.current();
    expect(fn).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(200);
    // trailing call fires
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("when unmounted, then cancels pending calls", () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() =>
      useThrottledCallback(fn, 200, []),
    );

    result.current();
    unmount();

    vi.advanceTimersByTime(200);
    // The trailing call should have been cancelled
    expect(fn).not.toHaveBeenCalled();
  });

  it("when accessed, then exposes cancel and flush methods", () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(fn, 200, []),
    );

    expect(typeof result.current.cancel).toBe("function");
    expect(typeof result.current.flush).toBe("function");
  });
});
