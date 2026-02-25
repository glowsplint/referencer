import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThrottledCallback } from "./use-throttled-callback";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("useThrottledCallback", () => {
  describe("when invoked with default options", () => {
    it("does not call immediately (leading: false by default)", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottledCallback(fn, 250));

      act(() => {
        result.current();
      });

      expect(fn).not.toHaveBeenCalled();
    });

    it("calls after the wait period (trailing: true by default)", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottledCallback(fn, 250));

      act(() => {
        result.current();
      });
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe("when invoked with leading: true", () => {
    it("calls immediately on first invocation", () => {
      const fn = vi.fn();
      const { result } = renderHook(() =>
        useThrottledCallback(fn, 250, [], { leading: true, trailing: false }),
      );

      act(() => {
        result.current();
      });

      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe("when called multiple times within the wait period", () => {
    it("only calls once after the wait", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottledCallback(fn, 250));

      act(() => {
        result.current();
        result.current();
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe("when cancel is called", () => {
    it("prevents the pending call", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottledCallback(fn, 250));

      act(() => {
        result.current();
      });
      act(() => {
        result.current.cancel();
      });
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("when flush is called", () => {
    it("executes the pending call immediately", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottledCallback(fn, 250));

      act(() => {
        result.current();
      });
      act(() => {
        result.current.flush();
      });

      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe("when unmounted", () => {
    it("cancels pending calls", () => {
      const fn = vi.fn();
      const { result, unmount } = renderHook(() => useThrottledCallback(fn, 250));

      act(() => {
        result.current();
      });
      unmount();

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("when arguments are passed", () => {
    it("forwards arguments to the original function", () => {
      const fn = vi.fn();
      const { result } = renderHook(() =>
        useThrottledCallback(fn, 250, [], { leading: true, trailing: false }),
      );

      act(() => {
        result.current("arg1", 42);
      });

      expect(fn).toHaveBeenCalledWith("arg1", 42);
    });
  });
});
