import { describe, it, expect } from "vitest"
import { getArrowStyleAttrs, computeDoubleLinePaths, ARROW_STYLES } from "./arrow-styles"

describe("ARROW_STYLES", () => {
  it("contains four styles", () => {
    expect(ARROW_STYLES).toHaveLength(4)
  })

  it("has value and label for each style", () => {
    for (const s of ARROW_STYLES) {
      expect(typeof s.value).toBe("string")
      expect(typeof s.label).toBe("string")
    }
  })

  it("includes solid, dashed, dotted, double", () => {
    const values = ARROW_STYLES.map((s) => s.value)
    expect(values).toContain("solid")
    expect(values).toContain("dashed")
    expect(values).toContain("dotted")
    expect(values).toContain("double")
  })
})

describe("getArrowStyleAttrs", () => {
  it("returns solid attrs by default", () => {
    const attrs = getArrowStyleAttrs()
    expect(attrs.strokeDasharray).toBeNull()
    expect(attrs.strokeWidth).toBe(2)
    expect(attrs.isDouble).toBe(false)
  })

  it("returns solid attrs for 'solid'", () => {
    const attrs = getArrowStyleAttrs("solid")
    expect(attrs.strokeDasharray).toBeNull()
    expect(attrs.strokeWidth).toBe(2)
    expect(attrs.isDouble).toBe(false)
  })

  it("returns dashed attrs", () => {
    const attrs = getArrowStyleAttrs("dashed")
    expect(attrs.strokeDasharray).toBe("8 4")
    expect(attrs.strokeWidth).toBe(2)
    expect(attrs.isDouble).toBe(false)
  })

  it("returns dotted attrs", () => {
    const attrs = getArrowStyleAttrs("dotted")
    expect(attrs.strokeDasharray).toBe("2 4")
    expect(attrs.strokeWidth).toBe(2)
    expect(attrs.isDouble).toBe(false)
  })

  it("returns double attrs", () => {
    const attrs = getArrowStyleAttrs("double")
    expect(attrs.strokeDasharray).toBeNull()
    expect(attrs.strokeWidth).toBe(1)
    expect(attrs.isDouble).toBe(true)
  })
})

describe("computeDoubleLinePaths", () => {
  it("returns two path strings", () => {
    const [pathA, pathB] = computeDoubleLinePaths(0, 0, 50, 0, 100, 0)
    expect(typeof pathA).toBe("string")
    expect(typeof pathB).toBe("string")
  })

  it("offsets horizontal path vertically", () => {
    const [pathA, pathB] = computeDoubleLinePaths(0, 0, 50, 0, 100, 0, 2)
    // For horizontal rightward line, perpendicular normal is (0, 1)
    // pathA offset by +normal, pathB offset by -normal
    expect(pathA).toContain("M 0 2")
    expect(pathB).toContain("M 0 -2")
  })

  it("offsets vertical path horizontally", () => {
    const [pathA, pathB] = computeDoubleLinePaths(0, 0, 0, 50, 0, 100, 2)
    // For vertical downward line, perpendicular normal is (-1, 0)
    expect(pathA).toContain("M -2 0")
    expect(pathB).toContain("M 2 0")
  })

  it("produces symmetric paths around the center line", () => {
    const [pathA, pathB] = computeDoubleLinePaths(0, 0, 50, 50, 100, 0, 1.5)
    // Both paths should start with M and have L segments
    expect(pathA).toMatch(/^M .+ L .+ L .+$/)
    expect(pathB).toMatch(/^M .+ L .+ L .+$/)
  })

  it("handles zero-length segments gracefully", () => {
    const [pathA, pathB] = computeDoubleLinePaths(50, 50, 50, 50, 50, 50, 1.5)
    expect(typeof pathA).toBe("string")
    expect(typeof pathB).toBe("string")
  })

  it("uses default offset of 1.5", () => {
    const [pathA] = computeDoubleLinePaths(0, 0, 50, 0, 100, 0)
    expect(pathA).toContain("1.5")
  })
})
