import { describe, it, expect } from "vitest";
import { normalizeTag, isValidTag, TAG_RE, MAX_TAG_LENGTH } from "./tag-utils";

describe("normalizeTag", () => {
  it("strips leading # and trims whitespace", () => {
    expect(normalizeTag("#grace")).toBe("grace");
    expect(normalizeTag("  grace  ")).toBe("grace");
    expect(normalizeTag("# grace ")).toBe("grace");
  });

  it("lowercases the tag", () => {
    expect(normalizeTag("Grace")).toBe("grace");
    expect(normalizeTag("#COVENANT")).toBe("covenant");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeTag("")).toBe("");
    expect(normalizeTag("#")).toBe("");
    expect(normalizeTag("  ")).toBe("");
  });
});

describe("isValidTag", () => {
  it("accepts simple lowercase tags", () => {
    expect(isValidTag("grace")).toBe(true);
    expect(isValidTag("covenant")).toBe(true);
    expect(isValidTag("prophecy")).toBe(true);
  });

  it("accepts tags with numbers", () => {
    expect(isValidTag("psalm23")).toBe(true);
    expect(isValidTag("2kings")).toBe(true);
  });

  it("accepts tags with hyphens between words", () => {
    expect(isValidTag("new-testament")).toBe(true);
    expect(isValidTag("old-testament")).toBe(true);
    expect(isValidTag("a-b-c")).toBe(true);
  });

  it("rejects tags starting or ending with hyphens", () => {
    expect(isValidTag("-grace")).toBe(false);
    expect(isValidTag("grace-")).toBe(false);
    expect(isValidTag("-")).toBe(false);
  });

  it("rejects tags with consecutive hyphens", () => {
    expect(isValidTag("old--testament")).toBe(false);
  });

  it("rejects tags with spaces", () => {
    expect(isValidTag("old testament")).toBe(false);
  });

  it("accepts tags with uppercase because normalization lowercases them first", () => {
    expect(isValidTag("Grace")).toBe(true);
    expect(isValidTag("COVENANT")).toBe(true);
  });

  it("rejects tags with special characters", () => {
    expect(isValidTag("grace!")).toBe(false);
    expect(isValidTag("hello@world")).toBe(false);
    expect(isValidTag("test.tag")).toBe(false);
  });

  it("rejects empty tags", () => {
    expect(isValidTag("")).toBe(false);
  });

  it("rejects tags exceeding max length", () => {
    const longTag = "a".repeat(MAX_TAG_LENGTH + 1);
    expect(isValidTag(longTag)).toBe(false);
  });

  it("accepts tags at exactly max length", () => {
    const maxTag = "a".repeat(MAX_TAG_LENGTH);
    expect(isValidTag(maxTag)).toBe(true);
  });

  it("normalizes before validating (strips # and lowercases)", () => {
    // isValidTag calls normalizeTag internally
    expect(isValidTag("#grace")).toBe(true);
    expect(isValidTag("  covenant  ")).toBe(true);
  });
});

describe("TAG_RE", () => {
  it("matches valid patterns", () => {
    expect(TAG_RE.test("abc")).toBe(true);
    expect(TAG_RE.test("abc-def")).toBe(true);
    expect(TAG_RE.test("a1b2")).toBe(true);
    expect(TAG_RE.test("a-1-b-2")).toBe(true);
  });

  it("rejects invalid patterns", () => {
    expect(TAG_RE.test("")).toBe(false);
    expect(TAG_RE.test("-abc")).toBe(false);
    expect(TAG_RE.test("abc-")).toBe(false);
    expect(TAG_RE.test("a--b")).toBe(false);
    expect(TAG_RE.test("ABC")).toBe(false);
  });
});
