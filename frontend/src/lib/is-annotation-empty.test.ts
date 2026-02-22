import { describe, it, expect } from "vitest";

// Inline copy of the function from App.tsx (module-level, not exported)
function isAnnotationEmpty(html: string): boolean {
  return !html?.replace(/<[^>]*>/g, "").trim();
}

describe("isAnnotationEmpty", () => {
  it("returns true for empty string", () => {
    expect(isAnnotationEmpty("")).toBe(true);
  });

  it("returns true for <p></p>", () => {
    expect(isAnnotationEmpty("<p></p>")).toBe(true);
  });

  it("returns true for <p><br></p>", () => {
    expect(isAnnotationEmpty("<p><br></p>")).toBe(true);
  });

  it("returns true for nested empty tags", () => {
    expect(isAnnotationEmpty("<p><strong></strong></p>")).toBe(true);
  });

  it("returns true for whitespace-only content", () => {
    expect(isAnnotationEmpty("<p>   </p>")).toBe(true);
  });

  it("returns false for <p>hello</p>", () => {
    expect(isAnnotationEmpty("<p>hello</p>")).toBe(false);
  });

  it("returns false for <p><strong>text</strong></p>", () => {
    expect(isAnnotationEmpty("<p><strong>text</strong></p>")).toBe(false);
  });

  it("returns true for null/undefined via optional chaining", () => {
    expect(isAnnotationEmpty(null as unknown as string)).toBe(true);
    expect(isAnnotationEmpty(undefined as unknown as string)).toBe(true);
  });

  it("returns false for plain text without tags", () => {
    expect(isAnnotationEmpty("hello world")).toBe(false);
  });

  it("returns true for multiple empty paragraphs", () => {
    expect(isAnnotationEmpty("<p></p><p></p>")).toBe(true);
  });
});
