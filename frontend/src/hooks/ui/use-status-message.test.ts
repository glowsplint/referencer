import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStatusMessage } from "./use-status-message";

describe("useStatusMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with null message", () => {
    const { result } = renderHook(() => useStatusMessage());
    expect(result.current.message).toBeNull();
  });

  it("setStatus sets base message", () => {
    const { result } = renderHook(() => useStatusMessage());

    act(() => {
      result.current.setStatus({ text: "Hello", type: "info" });
    });

    expect(result.current.message).toEqual({ text: "Hello", type: "info" });
  });

  it("clearStatus clears both base and flash messages", () => {
    const { result } = renderHook(() => useStatusMessage());

    act(() => {
      result.current.setStatus({ text: "Hello", type: "info" });
    });
    act(() => {
      result.current.clearStatus();
    });

    expect(result.current.message).toBeNull();
  });

  it("flashStatus temporarily overrides base message", () => {
    const { result } = renderHook(() => useStatusMessage());

    act(() => {
      result.current.setStatus({ text: "Base", type: "info" });
    });
    act(() => {
      result.current.flashStatus({ text: "Flash!", type: "success" }, 3000);
    });

    // Flash message should be displayed
    expect(result.current.message).toEqual({ text: "Flash!", type: "success" });

    // After duration, flash expires and base shows through
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.message).toEqual({ text: "Base", type: "info" });
  });

  it("flashStatus auto-clears when no base message set", () => {
    const { result } = renderHook(() => useStatusMessage());

    act(() => {
      result.current.flashStatus({ text: "Temporary", type: "success" }, 3000);
    });

    expect(result.current.message).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.message).toBeNull();
  });

  it("new flashStatus cancels previous flash timer", () => {
    const { result } = renderHook(() => useStatusMessage());

    act(() => {
      result.current.flashStatus({ text: "First", type: "success" }, 1000);
    });
    act(() => {
      result.current.flashStatus({ text: "Second", type: "success" }, 2000);
    });

    // After 1000ms, the first timer would have fired but was cancelled
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.message).toEqual({ text: "Second", type: "success" });

    // After another 1000ms (total 2000ms), the second timer fires
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.message).toBeNull();
  });

  it("setStatus does not clear active flash", () => {
    const { result } = renderHook(() => useStatusMessage());

    act(() => {
      result.current.flashStatus({ text: "Flash!", type: "success" }, 3000);
    });
    act(() => {
      result.current.setStatus({ text: "New base", type: "info" });
    });

    // Flash should still be showing
    expect(result.current.message).toEqual({ text: "Flash!", type: "success" });

    // After flash expires, new base shows
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.message).toEqual({ text: "New base", type: "info" });
  });

  it("clearStatus cancels pending flash timer", () => {
    const { result } = renderHook(() => useStatusMessage());

    act(() => {
      result.current.setStatus({ text: "Base", type: "info" });
    });
    act(() => {
      result.current.flashStatus({ text: "Flash!", type: "success" }, 2000);
    });
    act(() => {
      result.current.clearStatus();
    });

    expect(result.current.message).toBeNull();

    // Timer should not bring anything back
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.message).toBeNull();
  });
});
