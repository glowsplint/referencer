import { describe, it, expect } from "vitest";
import { sanitizeColor } from "./sanitize-color";

const FALLBACK = "#888888";

describe("sanitizeColor", () => {
  describe("when given valid hex colors", () => {
    it("then accepts 3-digit hex", () => {
      expect(sanitizeColor("#abc")).toBe("#abc");
    });

    it("then accepts 4-digit hex (with alpha)", () => {
      expect(sanitizeColor("#abcf")).toBe("#abcf");
    });

    it("then accepts 6-digit hex", () => {
      expect(sanitizeColor("#ff00aa")).toBe("#ff00aa");
    });

    it("then accepts 8-digit hex (with alpha)", () => {
      expect(sanitizeColor("#ff00aa80")).toBe("#ff00aa80");
    });

    it("then accepts uppercase hex", () => {
      expect(sanitizeColor("#AABBCC")).toBe("#AABBCC");
    });

    it("then accepts mixed-case hex", () => {
      expect(sanitizeColor("#aAbBcC")).toBe("#aAbBcC");
    });

    it("then trims surrounding whitespace", () => {
      expect(sanitizeColor("  #ff0000  ")).toBe("#ff0000");
    });
  });

  describe("when given valid rgb/rgba colors", () => {
    it("then accepts rgb()", () => {
      expect(sanitizeColor("rgb(255, 0, 128)")).toBe("rgb(255, 0, 128)");
    });

    it("then accepts rgba() with decimal alpha", () => {
      expect(sanitizeColor("rgba(10, 20, 30, 0.5)")).toBe("rgba(10, 20, 30, 0.5)");
    });

    it("then accepts rgba() with alpha 0", () => {
      expect(sanitizeColor("rgba(0, 0, 0, 0)")).toBe("rgba(0, 0, 0, 0)");
    });

    it("then accepts rgba() with alpha 1", () => {
      expect(sanitizeColor("rgba(255, 255, 255, 1)")).toBe("rgba(255, 255, 255, 1)");
    });

    it("then trims surrounding whitespace", () => {
      expect(sanitizeColor("  rgb(1,2,3)  ")).toBe("rgb(1,2,3)");
    });
  });

  describe("when given invalid or malicious input", () => {
    it("then rejects empty string", () => {
      expect(sanitizeColor("")).toBe(FALLBACK);
    });

    it("then rejects hex without hash", () => {
      expect(sanitizeColor("ff0000")).toBe(FALLBACK);
    });

    it("then rejects CSS injection via expression()", () => {
      expect(sanitizeColor("expression(alert(1))")).toBe(FALLBACK);
    });

    it("then rejects url() injection", () => {
      expect(sanitizeColor("url(https://evil.com)")).toBe(FALLBACK);
    });

    it("then rejects named colors", () => {
      expect(sanitizeColor("red")).toBe(FALLBACK);
    });

    it("then rejects hsl() colors", () => {
      expect(sanitizeColor("hsl(120, 50%, 50%)")).toBe(FALLBACK);
    });

    it("then rejects hex with trailing garbage", () => {
      expect(sanitizeColor("#ff0000;background:url(x)")).toBe(FALLBACK);
    });

    it("then rejects rgb with negative values", () => {
      expect(sanitizeColor("rgb(-1, 0, 0)")).toBe(FALLBACK);
    });

    it("then rejects non-string input", () => {
      expect(sanitizeColor(null as unknown as string)).toBe(FALLBACK);
      expect(sanitizeColor(undefined as unknown as string)).toBe(FALLBACK);
      expect(sanitizeColor(42 as unknown as string)).toBe(FALLBACK);
    });
  });
});
