import { describe, it, expect } from "vitest";
import { isAllowedUri, sanitizeUrl } from "./url";

describe("isAllowedUri", () => {
  describe("when uri is undefined", () => {
    it("returns truthy (empty/undefined is allowed)", () => {
      expect(isAllowedUri(undefined)).toBeTruthy();
    });
  });

  describe("when uri is empty string", () => {
    it("returns truthy", () => {
      expect(isAllowedUri("")).toBeTruthy();
    });
  });

  describe("when uri uses http protocol", () => {
    it("returns truthy", () => {
      expect(isAllowedUri("http://example.com")).toBeTruthy();
    });
  });

  describe("when uri uses https protocol", () => {
    it("returns truthy", () => {
      expect(isAllowedUri("https://example.com")).toBeTruthy();
    });
  });

  describe("when uri uses mailto protocol", () => {
    it("returns truthy", () => {
      expect(isAllowedUri("mailto:test@example.com")).toBeTruthy();
    });
  });

  describe("when uri uses tel protocol", () => {
    it("returns truthy", () => {
      expect(isAllowedUri("tel:+1234567890")).toBeTruthy();
    });
  });

  describe("when uri uses javascript protocol", () => {
    it("returns falsy", () => {
      expect(isAllowedUri("javascript:alert(1)")).toBeFalsy();
    });
  });

  describe("when uri uses data protocol", () => {
    it("returns falsy", () => {
      expect(isAllowedUri("data:text/html,<h1>bad</h1>")).toBeFalsy();
    });
  });

  describe("when additional protocols are provided", () => {
    it("allows custom string protocol", () => {
      expect(isAllowedUri("custom:something", ["custom"])).toBeTruthy();
    });

    it("allows custom protocol object", () => {
      expect(isAllowedUri("myproto:something", [{ scheme: "myproto" }])).toBeTruthy();
    });
  });
});

describe("sanitizeUrl", () => {
  describe("when given a valid absolute URL", () => {
    it("returns the normalized URL", () => {
      expect(sanitizeUrl("https://example.com/path", "https://base.com")).toBe(
        "https://example.com/path",
      );
    });
  });

  describe("when given a relative URL", () => {
    it("resolves against the base URL", () => {
      expect(sanitizeUrl("/path", "https://base.com")).toBe("https://base.com/path");
    });
  });

  describe("when given a javascript: URL", () => {
    it("returns '#'", () => {
      expect(sanitizeUrl("javascript:alert(1)", "https://base.com")).toBe("#");
    });
  });

  describe("when given an invalid URL that cannot be parsed", () => {
    it("returns '#'", () => {
      expect(sanitizeUrl("://totally broken", "://also broken")).toBe("#");
    });
  });

  describe("when URL is valid with custom protocols", () => {
    it("allows the URL through", () => {
      expect(sanitizeUrl("ftp://files.example.com", "https://base.com")).toBe(
        "ftp://files.example.com/",
      );
    });
  });
});
