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

  it("when initialized, then returns false", () => {
    const { result } = renderHook(() => useScrolling());
    expect(result.current).toBe(false);
  });

  // jsdom has `onscrollend` in window, so the hook uses the scrollend event path
  // for window targets. We need to fire scrollend to reset.
  it("when scroll occurs on window, then becomes true; on scrollend becomes false", () => {
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

  it("when multiple scroll events fire, then stays true until scrollend", () => {
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

  it("when using element ref target without scrollend, then uses debounce fallback", () => {
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

  it("when subsequent scroll events fire on element target, then resets debounce timer", () => {
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

  it("when unmounted, then cleans up event listeners", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => useScrolling());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
