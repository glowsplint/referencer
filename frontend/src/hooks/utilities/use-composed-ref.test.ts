import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useComposedRef } from "./use-composed-ref";
import { createRef } from "react";

describe("useComposedRef", () => {
  it("when called with callback user ref, then sets both library ref and callback user ref", () => {
    const libRef = createRef<HTMLDivElement>();
    const userCallback = vi.fn();
    const element = document.createElement("div");

    const { result } = renderHook(() => useComposedRef(libRef, userCallback));

    result.current(element);

    expect(libRef.current).toBe(element);
    expect(userCallback).toHaveBeenCalledWith(element);
  });

  it("when called with object user ref, then sets both library ref and object user ref", () => {
    const libRef = createRef<HTMLDivElement>();
    const userRef = createRef<HTMLDivElement>();
    const element = document.createElement("div");

    const { result } = renderHook(() => useComposedRef(libRef, userRef));

    result.current(element);

    expect(libRef.current).toBe(element);
    expect(userRef.current).toBe(element);
  });

  it("when user ref changes, then cleans up previous user ref", () => {
    const libRef = createRef<HTMLDivElement>();
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const element = document.createElement("div");

    const { result, rerender } = renderHook(
      ({ userRef }) => useComposedRef(libRef, userRef),
      { initialProps: { userRef: firstCallback as ((instance: HTMLDivElement | null) => void) | null } },
    );

    // Attach with first callback
    result.current(element);
    expect(firstCallback).toHaveBeenCalledWith(element);

    // Change to second callback
    rerender({ userRef: secondCallback });

    // Attach again — should cleanup first ref (set to null) and set second
    const newElement = document.createElement("div");
    result.current(newElement);

    expect(firstCallback).toHaveBeenCalledWith(null);
    expect(secondCallback).toHaveBeenCalledWith(newElement);
  });

  it("when user ref is null, then handles gracefully", () => {
    const libRef = createRef<HTMLDivElement>();
    const element = document.createElement("div");

    const { result } = renderHook(() => useComposedRef(libRef, null));

    // Should not throw
    result.current(element);
    expect(libRef.current).toBe(element);
  });

  it("when user ref is undefined, then handles gracefully", () => {
    const libRef = createRef<HTMLDivElement>();
    const element = document.createElement("div");

    const { result } = renderHook(() => useComposedRef(libRef, undefined));

    result.current(element);
    expect(libRef.current).toBe(element);
  });
});
