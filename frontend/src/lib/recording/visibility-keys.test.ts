import { describe, it, expect } from "vitest";
import { parseVisibilityKey } from "./visibility-keys";

describe("parseVisibilityKey", () => {
  it("parses highlight key into parts", () => {
    const result = parseVisibilityKey("highlight:layer-1:annot-1");
    expect(result).toEqual({
      type: "highlight",
      layerId: "layer-1",
      annotationId: "annot-1",
      yType: "highlights",
    });
  });

  it("parses arrow key into parts", () => {
    const result = parseVisibilityKey("arrow:layer-2:arrow-1");
    expect(result).toEqual({
      type: "arrow",
      layerId: "layer-2",
      annotationId: "arrow-1",
      yType: "arrows",
    });
  });

  it("parses underline key into parts", () => {
    const result = parseVisibilityKey("underline:layer-3:ul-1");
    expect(result).toEqual({
      type: "underline",
      layerId: "layer-3",
      annotationId: "ul-1",
      yType: "underlines",
    });
  });

  it("handles colons in annotationId", () => {
    const result = parseVisibilityKey("highlight:layer-1:annot:with:colons");
    expect(result).toEqual({
      type: "highlight",
      layerId: "layer-1",
      annotationId: "annot:with:colons",
      yType: "highlights",
    });
  });

  it("maps type to correct yType", () => {
    expect(parseVisibilityKey("highlight:l:a").yType).toBe("highlights");
    expect(parseVisibilityKey("arrow:l:a").yType).toBe("arrows");
    expect(parseVisibilityKey("underline:l:a").yType).toBe("underlines");
  });
});
