import { describe, it, expect } from "vitest"
import { parseHexToRgba } from "./color"

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
