import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useLatestRef } from "../use-latest-ref";

describe("useLatestRef", () => {
  it("initially holds the provided value", () => {
    const { result } = renderHook(() => useLatestRef(42));
    expect(result.current.current).toBe(42);
  });

  it("updates the ref when the value changes", () => {
    const { result, rerender } = renderHook(({ val }) => useLatestRef(val), {
      initialProps: { val: "first" },
    });
    expect(result.current.current).toBe("first");

    rerender({ val: "second" });
    expect(result.current.current).toBe("second");
  });

  it("returns a stable ref object across renders", () => {
    const { result, rerender } = renderHook(({ val }) => useLatestRef(val), {
      initialProps: { val: 1 },
    });
    const firstRef = result.current;

    rerender({ val: 2 });
    expect(result.current).toBe(firstRef);

    rerender({ val: 3 });
    expect(result.current).toBe(firstRef);
  });
});
