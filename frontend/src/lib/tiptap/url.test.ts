import { describe, it, expect } from "vitest";
import { isAllowedUri, sanitizeUrl } from "./url";

describe("when using isAllowedUri", () => {
  it("then allows http URLs", () => {
    expect(isAllowedUri("http://example.com")).toBeTruthy();
  });

  it("then allows https URLs", () => {
    expect(isAllowedUri("https://example.com")).toBeTruthy();
  });

  it("then allows mailto URLs", () => {
    expect(isAllowedUri("mailto:user@example.com")).toBeTruthy();
  });

  it("then allows tel URLs", () => {
    expect(isAllowedUri("tel:+1234567890")).toBeTruthy();
  });

  it("then allows ftp URLs", () => {
    expect(isAllowedUri("ftp://files.example.com")).toBeTruthy();
  });

  it("then allows undefined (treated as empty/safe)", () => {
    expect(isAllowedUri(undefined)).toBeTruthy();
  });

  it("then allows empty string", () => {
    expect(isAllowedUri("")).toBeTruthy();
  });

  it("then blocks javascript: protocol", () => {
    expect(isAllowedUri("javascript:alert(1)")).toBeFalsy();
  });

  it("then blocks javascript: with whitespace obfuscation", () => {
    expect(isAllowedUri("java\u0000script:alert(1)")).toBeFalsy();
  });

  it("then allows relative paths (no protocol)", () => {
    expect(isAllowedUri("/path/to/page")).toBeTruthy();
  });

  it("then allows hash fragments", () => {
    expect(isAllowedUri("#section")).toBeTruthy();
  });

  it("then accepts custom protocol via string config", () => {
    expect(isAllowedUri("custom:something", ["custom"])).toBeTruthy();
  });

  it("then accepts custom protocol via object config", () => {
    expect(isAllowedUri("custom:something", [{ scheme: "custom" }])).toBeTruthy();
  });

  it("then skips protocol objects with empty scheme", () => {
    expect(isAllowedUri("http://example.com", [{ scheme: "" }])).toBeTruthy();
  });
});

describe("when using sanitizeUrl", () => {
  it("then returns full URL for valid absolute URL", () => {
    expect(sanitizeUrl("https://example.com/page", "https://base.com")).toBe(
      "https://example.com/page",
    );
  });

  it("then resolves relative URL against base", () => {
    const result = sanitizeUrl("/path", "https://base.com");
    expect(result).toBe("https://base.com/path");
  });

  it("then returns # for javascript: protocol", () => {
    expect(sanitizeUrl("javascript:alert(1)", "https://base.com")).toBe("#");
  });

  it("then returns # for invalid URL that cannot be parsed", () => {
    expect(sanitizeUrl("://broken", "://also-broken")).toBe("#");
  });

  it("then passes custom protocols through", () => {
    const result = sanitizeUrl("https://example.com", "https://base.com", ["custom"]);
    expect(result).toBe("https://example.com/");
  });
});
