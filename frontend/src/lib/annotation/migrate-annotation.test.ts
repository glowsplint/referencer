import { describe, it, expect } from "vitest";
import { migrateAnnotation } from "./migrate-annotation";

describe("when using migrateAnnotation", () => {
  it("then returns empty string for empty input", () => {
    expect(migrateAnnotation("")).toBe("");
  });

  it("then returns HTML as-is when it starts with a tag", () => {
    expect(migrateAnnotation("<p>hello</p>")).toBe("<p>hello</p>");
  });

  it("then wraps plain text in paragraph tags", () => {
    expect(migrateAnnotation("hello")).toBe("<p>hello</p>");
  });

  it("then wraps multi-line text with each line in paragraph tags", () => {
    expect(migrateAnnotation("line1\nline2")).toBe("<p>line1</p><p>line2</p>");
  });

  it("then converts empty lines to <p><br></p>", () => {
    expect(migrateAnnotation("line1\n\nline2")).toBe("<p>line1</p><p><br></p><p>line2</p>");
  });

  it("then returns HTML with leading whitespace before tag as-is", () => {
    expect(migrateAnnotation("  <p>spaced</p>")).toBe("  <p>spaced</p>");
  });
});
