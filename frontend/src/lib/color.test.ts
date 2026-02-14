import { describe, it, expect } from "vitest"
import { parseHexToRgba, blendWithBackground, blendColors } from "./color"

describe("parseHexToRgba", () => {
  it("converts a standard hex colour with alpha", () => {
    expect(parseHexToRgba("#fca5a5", 0.3)).toBe("rgba(252, 165, 165, 0.3)")
  })

  it("converts black", () => {
    expect(parseHexToRgba("#000000", 1)).toBe("rgba(0, 0, 0, 1)")
  })

  it("converts white", () => {
    expect(parseHexToRgba("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)")
  })

  it("handles zero alpha", () => {
    expect(parseHexToRgba("#93c5fd", 0)).toBe("rgba(147, 197, 253, 0)")
  })
})

describe("blendWithBackground", () => {
  it("blends color with white background in light mode", () => {
    // #fca5a5 (252, 165, 165) at 0.3 against white (255, 255, 255)
    // r = round(252*0.3 + 255*0.7) = 254
    // g = round(165*0.3 + 255*0.7) = 228
    // b = round(165*0.3 + 255*0.7) = 228
    expect(blendWithBackground("#fca5a5", 0.3, false)).toBe("rgb(254, 228, 228)")
  })

  it("blends color with dark background in dark mode", () => {
    // #fca5a5 (252, 165, 165) at 0.3 against dark (14, 14, 17)
    // r = round(252*0.3 + 14*0.7) = round(85.4) = 85
    // g = round(165*0.3 + 14*0.7) = round(59.3) = 59
    // b = round(165*0.3 + 17*0.7) = round(61.4) = 61
    expect(blendWithBackground("#fca5a5", 0.3, true)).toBe("rgb(85, 59, 61)")
  })

  it("returns background color at alpha 0", () => {
    expect(blendWithBackground("#ff0000", 0, false)).toBe("rgb(255, 255, 255)")
    expect(blendWithBackground("#ff0000", 0, true)).toBe("rgb(14, 14, 17)")
  })

  it("returns foreground color at alpha 1", () => {
    expect(blendWithBackground("#ff0000", 1, false)).toBe("rgb(255, 0, 0)")
    expect(blendWithBackground("#ff0000", 1, true)).toBe("rgb(255, 0, 0)")
  })
})

describe("blendColors", () => {
  it("returns background color for empty entries", () => {
    expect(blendColors([], false)).toBe("rgb(255, 255, 255)")
    expect(blendColors([], true)).toBe("rgb(14, 14, 17)")
  })

  it("matches blendWithBackground for a single entry", () => {
    const single = blendColors([{ hex: "#fca5a5", opacity: 0.3 }], false)
    const direct = blendWithBackground("#fca5a5", 0.3, false)
    expect(single).toBe(direct)
  })

  it("matches blendWithBackground for a single entry in dark mode", () => {
    const single = blendColors([{ hex: "#93c5fd", opacity: 0.6 }], true)
    const direct = blendWithBackground("#93c5fd", 0.6, true)
    expect(single).toBe(direct)
  })

  it("blends two colors together", () => {
    const result = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.3 },
      ],
      false
    )
    const redOnly = blendWithBackground("#fca5a5", 0.3, false)
    const blueOnly = blendWithBackground("#93c5fd", 0.3, false)
    expect(result).not.toBe(redOnly)
    expect(result).not.toBe(blueOnly)
    expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it("produces deterministic results regardless of input order", () => {
    const a = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.6 },
      ],
      false
    )
    const b = blendColors(
      [
        { hex: "#93c5fd", opacity: 0.6 },
        { hex: "#fca5a5", opacity: 0.3 },
      ],
      false
    )
    expect(a).toBe(b)
  })

  it("blends three colors", () => {
    const result = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.3 },
        { hex: "#bef264", opacity: 0.3 },
      ],
      false
    )
    expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it("differs between light and dark mode", () => {
    const light = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.3 },
      ],
      false
    )
    const dark = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.3 },
      ],
      true
    )
    expect(light).not.toBe(dark)
  })
})
