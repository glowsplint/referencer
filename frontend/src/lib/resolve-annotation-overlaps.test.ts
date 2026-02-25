import { describe, it, expect } from "vitest";
import { resolveAnnotationOverlaps } from "./resolve-annotation-overlaps";

describe("when using resolveAnnotationOverlaps", () => {
  it("then returns empty array for empty input", () => {
    expect(resolveAnnotationOverlaps([])).toEqual([]);
  });

  it("then preserves position for a single annotation", () => {
    const result = resolveAnnotationOverlaps([{ id: "a", desiredTop: 100 }]);
    expect(result).toEqual([{ id: "a", top: 100 }]);
  });

  it("then preserves positions when annotations are spaced far apart", () => {
    const result = resolveAnnotationOverlaps([
      { id: "a", desiredTop: 0 },
      { id: "b", desiredTop: 200 },
    ]);
    expect(result).toEqual([
      { id: "a", top: 0 },
      { id: "b", top: 200 },
    ]);
  });

  it("then pushes overlapping annotations down", () => {
    const result = resolveAnnotationOverlaps([
      { id: "a", desiredTop: 100 },
      { id: "b", desiredTop: 110 },
    ]);
    expect(result[0].top).toBe(100);
    // 72 (card height) + 8 (gap) = 80
    expect(result[1].top).toBe(180);
  });

  it("then cascades pushes for multiple overlapping annotations", () => {
    const result = resolveAnnotationOverlaps([
      { id: "a", desiredTop: 0 },
      { id: "b", desiredTop: 10 },
      { id: "c", desiredTop: 20 },
    ]);
    expect(result[0].top).toBe(0);
    expect(result[1].top).toBe(80); // 0 + 72 + 8
    expect(result[2].top).toBe(160); // 80 + 72 + 8
  });

  it("then sorts by desiredTop regardless of input order", () => {
    const result = resolveAnnotationOverlaps([
      { id: "b", desiredTop: 200 },
      { id: "a", desiredTop: 100 },
    ]);
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("b");
  });

  it("then uses measured heights when provided", () => {
    const heights = new Map([["a", 120]]); // card "a" is taller than default 72px
    const result = resolveAnnotationOverlaps(
      [
        { id: "a", desiredTop: 0 },
        { id: "b", desiredTop: 50 },
      ],
      heights,
    );
    expect(result[0].top).toBe(0);
    // 120 (measured height) + 8 (gap) = 128
    expect(result[1].top).toBe(128);
  });

  it("then falls back to default height for unmeasured cards", () => {
    const heights = new Map([["a", 100]]);
    const result = resolveAnnotationOverlaps(
      [
        { id: "a", desiredTop: 0 },
        { id: "b", desiredTop: 10 },
        { id: "c", desiredTop: 20 },
      ],
      heights,
    );
    expect(result[0].top).toBe(0);
    expect(result[1].top).toBe(108); // 0 + 100 (measured) + 8
    expect(result[2].top).toBe(188); // 108 + 72 (default, "b" unmeasured) + 8
  });
});
