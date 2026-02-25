import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsBreakpoint } from "./use-is-breakpoint";

describe("useIsBreakpoint", () => {
  let changeHandler: ((e: { matches: boolean }) => void) | null;

  beforeEach(() => {
    changeHandler = null;
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, handler: unknown) => {
        changeHandler = handler as (e: { matches: boolean }) => void;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("'max' mode returns true when viewport is below breakpoint", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useIsBreakpoint("max", 768));
    expect(result.current).toBe(true);
  });

  it("'min' mode returns true when viewport is at or above breakpoint", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useIsBreakpoint("min", 1024));
    expect(result.current).toBe(true);
  });

  it("returns false when matchMedia does not match", () => {
    const { result } = renderHook(() => useIsBreakpoint("max", 768));
    expect(result.current).toBe(false);
  });

  it("updates when matchMedia fires a change event", () => {
    const { result } = renderHook(() => useIsBreakpoint("max", 768));
    expect(result.current).toBe(false);

    act(() => {
      changeHandler?.({ matches: true });
    });
    expect(result.current).toBe(true);
  });

  it("builds max-width query with breakpoint - 1", () => {
    renderHook(() => useIsBreakpoint("max", 768));
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("builds min-width query with exact breakpoint", () => {
    renderHook(() => useIsBreakpoint("min", 1024));
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 1024px)");
  });
});
