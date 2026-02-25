import { describe, it, expect } from "vitest";
import { parseHexToRgba, blendWithBackground, blendColors } from "./color";

describe("when using parseHexToRgba", () => {
  it("then converts a standard hex colour with alpha", () => {
    expect(parseHexToRgba("#fca5a5", 0.3)).toBe("rgba(252, 165, 165, 0.3)");
  });

  it("then converts black", () => {
    expect(parseHexToRgba("#000000", 1)).toBe("rgba(0, 0, 0, 1)");
  });

  it("then converts white", () => {
    expect(parseHexToRgba("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("then handles zero alpha", () => {
    expect(parseHexToRgba("#93c5fd", 0)).toBe("rgba(147, 197, 253, 0)");
  });
});

describe("when using blendWithBackground", () => {
  it("then blends color with white background in light mode", () => {
    // #fca5a5 (252, 165, 165) at 0.3 against white (255, 255, 255)
    // r = round(252*0.3 + 255*0.7) = 254
    // g = round(165*0.3 + 255*0.7) = 228
    // b = round(165*0.3 + 255*0.7) = 228
    expect(blendWithBackground("#fca5a5", 0.3, false)).toBe("rgb(254, 228, 228)");
  });

  it("then blends color with dark background in dark mode", () => {
    // #fca5a5 (252, 165, 165) at 0.3 against dark (14, 14, 17)
    // r = round(252*0.3 + 14*0.7) = round(85.4) = 85
    // g = round(165*0.3 + 14*0.7) = round(59.3) = 59
    // b = round(165*0.3 + 17*0.7) = round(61.4) = 61
    expect(blendWithBackground("#fca5a5", 0.3, true)).toBe("rgb(85, 59, 61)");
  });

  it("then returns background color at alpha 0", () => {
    expect(blendWithBackground("#ff0000", 0, false)).toBe("rgb(255, 255, 255)");
    expect(blendWithBackground("#ff0000", 0, true)).toBe("rgb(14, 14, 17)");
  });

  it("then returns foreground color at alpha 1", () => {
    expect(blendWithBackground("#ff0000", 1, false)).toBe("rgb(255, 0, 0)");
    expect(blendWithBackground("#ff0000", 1, true)).toBe("rgb(255, 0, 0)");
  });
});

describe("when using blendColors", () => {
  it("then returns background color for empty entries", () => {
    expect(blendColors([], false)).toBe("rgb(255, 255, 255)");
    expect(blendColors([], true)).toBe("rgb(14, 14, 17)");
  });

  it("then matches blendWithBackground for a single entry", () => {
    const single = blendColors([{ hex: "#fca5a5", opacity: 0.3 }], false);
    const direct = blendWithBackground("#fca5a5", 0.3, false);
    expect(single).toBe(direct);
  });

  it("then matches blendWithBackground for a single entry in dark mode", () => {
    const single = blendColors([{ hex: "#93c5fd", opacity: 0.6 }], true);
    const direct = blendWithBackground("#93c5fd", 0.6, true);
    expect(single).toBe(direct);
  });

  it("then blends two colors together", () => {
    const result = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.3 },
      ],
      false,
    );
    const redOnly = blendWithBackground("#fca5a5", 0.3, false);
    const blueOnly = blendWithBackground("#93c5fd", 0.3, false);
    expect(result).not.toBe(redOnly);
    expect(result).not.toBe(blueOnly);
    expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it("then produces deterministic results regardless of input order", () => {
    const a = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.6 },
      ],
      false,
    );
    const b = blendColors(
      [
        { hex: "#93c5fd", opacity: 0.6 },
        { hex: "#fca5a5", opacity: 0.3 },
      ],
      false,
    );
    expect(a).toBe(b);
  });

  it("then blends three colors", () => {
    const result = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.3 },
        { hex: "#bef264", opacity: 0.3 },
      ],
      false,
    );
    expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it("then differs between light and dark mode", () => {
    const light = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.3 },
      ],
      false,
    );
    const dark = blendColors(
      [
        { hex: "#fca5a5", opacity: 0.3 },
        { hex: "#93c5fd", opacity: 0.3 },
      ],
      true,
    );
    expect(light).not.toBe(dark);
  });
});
