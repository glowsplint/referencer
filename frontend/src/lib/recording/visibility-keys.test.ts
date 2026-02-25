import { describe, it, expect } from "vitest";
import { parseVisibilityKey } from "./visibility-keys";

describe("parseVisibilityKey", () => {
  describe("when key is a highlight", () => {
    it("parses type, layerId, annotationId, and yType", () => {
      const result = parseVisibilityKey("highlight:layer-1:ann-42");
      expect(result).toEqual({
        type: "highlight",
        layerId: "layer-1",
        annotationId: "ann-42",
        yType: "highlights",
      });
    });
  });

  describe("when key is an arrow", () => {
    it("maps yType to 'arrows'", () => {
      const result = parseVisibilityKey("arrow:layer-2:arr-99");
      expect(result).toEqual({
        type: "arrow",
        layerId: "layer-2",
        annotationId: "arr-99",
        yType: "arrows",
      });
    });
  });

  describe("when key is an underline", () => {
    it("maps yType to 'underlines'", () => {
      const result = parseVisibilityKey("underline:layer-3:und-7");
      expect(result).toEqual({
        type: "underline",
        layerId: "layer-3",
        annotationId: "und-7",
        yType: "underlines",
      });
    });
  });

  describe("when annotationId contains colons", () => {
    it("preserves the full annotationId", () => {
      const result = parseVisibilityKey("highlight:layer-1:part1:part2:part3");
      expect(result.annotationId).toBe("part1:part2:part3");
    });
  });
});
