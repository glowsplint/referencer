import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrolling } from "./use-scrolling";

describe("useScrolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false initially", () => {
    const { result } = renderHook(() => useScrolling());
    expect(result.current).toBe(false);
  });

  // jsdom has `onscrollend` in window, so the hook uses the scrollend event path
  // for window targets. We need to fire scrollend to reset.
  it("becomes true on scroll and false on scrollend (window target)", () => {
    const { result } = renderHook(() => useScrolling(undefined, { debounce: 100 }));

    act(() => {
      document.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    act(() => {
      document.dispatchEvent(new Event("scrollend"));
    });
    expect(result.current).toBe(false);
  });

  it("stays true between scroll events until scrollend fires", () => {
    const { result } = renderHook(() => useScrolling());

    act(() => {
      document.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    // Another scroll - still scrolling
    act(() => {
      document.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    // scrollend resets
    act(() => {
      document.dispatchEvent(new Event("scrollend"));
    });
    expect(result.current).toBe(false);
  });

  it("uses debounce fallback for element ref targets (no scrollend)", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const ref = { current: div };

    const { result } = renderHook(() =>
      useScrolling(ref, { debounce: 100, fallbackToDocument: false }),
    );

    act(() => {
      div.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe(false);

    document.body.removeChild(div);
  });

  it("resets debounce timer on subsequent scroll events for element targets", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const ref = { current: div };

    const { result } = renderHook(() =>
      useScrolling(ref, { debounce: 100, fallbackToDocument: false }),
    );

    act(() => {
      div.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    // Scroll again at 50ms
    act(() => {
      vi.advanceTimersByTime(50);
      div.dispatchEvent(new Event("scroll"));
    });

    // 50ms after second scroll — timer should still be active
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe(true);

    // 100ms after second scroll — should be false now
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe(false);

    document.body.removeChild(div);
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => useScrolling());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
