import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { useZenMode } from "./use-zen-mode";

describe("useZenMode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enterZenMode sets isZenMode to true", () => {
    const { result } = renderHook(() => useZenMode());
    expect(result.current.isZenMode).toBe(false);

    act(() => result.current.enterZenMode());
    expect(result.current.isZenMode).toBe(true);
  });

  it("exitZenMode sets isZenMode to false", () => {
    const { result } = renderHook(() => useZenMode());

    act(() => result.current.enterZenMode());
    expect(result.current.isZenMode).toBe(true);

    act(() => result.current.exitZenMode());
    expect(result.current.isZenMode).toBe(false);
  });

  it("single Escape does not exit zen mode", () => {
    const { result } = renderHook(() => useZenMode());

    act(() => result.current.enterZenMode());

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(result.current.isZenMode).toBe(true);
  });

  it("two Escapes within 500ms exits zen mode", () => {
    const { result } = renderHook(() => useZenMode());

    act(() => result.current.enterZenMode());

    act(() => {
      vi.setSystemTime(1000);
      fireEvent.keyDown(document, { key: "Escape" });
    });

    act(() => {
      vi.setSystemTime(1200);
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(result.current.isZenMode).toBe(false);
  });

  it("two Escapes more than 500ms apart does not exit", () => {
    const { result } = renderHook(() => useZenMode());

    act(() => result.current.enterZenMode());

    act(() => {
      vi.setSystemTime(1000);
      fireEvent.keyDown(document, { key: "Escape" });
    });

    act(() => {
      vi.setSystemTime(1600);
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(result.current.isZenMode).toBe(true);
  });

  it("when not in zen mode, Escape presses are ignored", () => {
    const { result } = renderHook(() => useZenMode());
    expect(result.current.isZenMode).toBe(false);

    // Press Escape twice quickly — should not change anything
    act(() => {
      vi.setSystemTime(1000);
      fireEvent.keyDown(document, { key: "Escape" });
    });

    act(() => {
      vi.setSystemTime(1100);
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(result.current.isZenMode).toBe(false);
  });
});
