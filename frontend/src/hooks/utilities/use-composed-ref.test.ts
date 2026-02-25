import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useComposedRef } from "./use-composed-ref";
import React from "react";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useComposedRef", () => {
  describe("when called with a libRef and callback userRef", () => {
    it("sets both refs to the instance", () => {
      const libRef: React.RefObject<HTMLDivElement | null> = { current: null };
      const userFn = vi.fn();

      const { result } = renderHook(() => useComposedRef(libRef, userFn));

      const element = document.createElement("div");
      act(() => {
        result.current(element);
      });

      expect(libRef.current).toBe(element);
      expect(userFn).toHaveBeenCalledWith(element);
    });
  });

  describe("when called with a libRef and object userRef", () => {
    it("sets both refs to the instance", () => {
      const libRef: React.RefObject<HTMLDivElement | null> = { current: null };
      const userRef: React.RefObject<HTMLDivElement | null> = { current: null };

      const { result } = renderHook(() => useComposedRef(libRef, userRef));

      const element = document.createElement("div");
      act(() => {
        result.current(element);
      });

      expect(libRef.current).toBe(element);
      expect(userRef.current).toBe(element);
    });
  });

  describe("when called with null userRef", () => {
    it("only sets the libRef", () => {
      const libRef: React.RefObject<HTMLDivElement | null> = { current: null };

      const { result } = renderHook(() => useComposedRef(libRef, null));

      const element = document.createElement("div");
      act(() => {
        result.current(element);
      });

      expect(libRef.current).toBe(element);
    });
  });

  describe("when instance changes to null (unmount)", () => {
    it("sets both refs to null", () => {
      const libRef: React.RefObject<HTMLDivElement | null> = { current: null };
      const userFn = vi.fn();

      const { result } = renderHook(() => useComposedRef(libRef, userFn));

      const element = document.createElement("div");
      act(() => {
        result.current(element);
      });
      act(() => {
        result.current(null);
      });

      expect(libRef.current).toBeNull();
      // userFn called with element, then with null (cleanup of prev), then with null (new userRef)
      expect(userFn).toHaveBeenCalledWith(null);
    });
  });

  describe("when userRef changes from one callback to another", () => {
    it("cleans up the previous ref and sets the new one", () => {
      const libRef: React.RefObject<HTMLDivElement | null> = { current: null };
      const userFn1 = vi.fn();
      const userFn2 = vi.fn();

      const { result, rerender } = renderHook(({ userRef }) => useComposedRef(libRef, userRef), {
        initialProps: { userRef: userFn1 as any },
      });

      const element = document.createElement("div");
      act(() => {
        result.current(element);
      });

      expect(userFn1).toHaveBeenCalledWith(element);

      rerender({ userRef: userFn2 });

      const newElement = document.createElement("span") as unknown as HTMLDivElement;
      act(() => {
        result.current(newElement);
      });

      // Previous ref should be cleaned up (set to null)
      expect(userFn1).toHaveBeenCalledWith(null);
      // New ref should receive the new element
      expect(userFn2).toHaveBeenCalledWith(newElement);
    });
  });
});
