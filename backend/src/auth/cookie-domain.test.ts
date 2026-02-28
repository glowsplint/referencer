import { describe, expect, it } from "vitest";
import { getCookieDomain, getPreviewOrigin, isAllowedOrigin } from "./cookie-domain";

function mockContext(
  headers: Record<string, string>,
  env: Record<string, unknown> = {},
) {
  return {
    req: {
      header(name: string) {
        return headers[name.toLowerCase()];
      },
    },
    env,
  };
}

const PAGES_ENV = { FRONTEND_URL: "https://referencer.pages.dev" };

describe("getCookieDomain", () => {
  it("returns parent domain for a preview subdomain", () => {
    const c = mockContext(
      { "x-forwarded-host": "abc123.referencer.pages.dev" },
      PAGES_ENV,
    );
    expect(getCookieDomain(c)).toBe("referencer.pages.dev");
  });

  it("returns domain for the production host", () => {
    const c = mockContext(
      { "x-forwarded-host": "referencer.pages.dev" },
      PAGES_ENV,
    );
    expect(getCookieDomain(c)).toBe("referencer.pages.dev");
  });

  it("returns undefined when no FRONTEND_URL env var", () => {
    const c = mockContext({ "x-forwarded-host": "abc123.referencer.pages.dev" });
    expect(getCookieDomain(c)).toBeUndefined();
  });

  it("returns undefined for localhost (local dev)", () => {
    const c = mockContext({ host: "localhost:8787" }, PAGES_ENV);
    expect(getCookieDomain(c)).toBeUndefined();
  });

  it("returns undefined for an unrelated domain", () => {
    const c = mockContext(
      { "x-forwarded-host": "evil.com" },
      PAGES_ENV,
    );
    expect(getCookieDomain(c)).toBeUndefined();
  });
});

describe("getPreviewOrigin", () => {
  it("returns full https origin for a preview subdomain", () => {
    const c = mockContext(
      { "x-forwarded-host": "abc123.referencer.pages.dev" },
      PAGES_ENV,
    );
    expect(getPreviewOrigin(c)).toBe("https://abc123.referencer.pages.dev");
  });

  it("returns null for the production host (not a preview)", () => {
    const c = mockContext(
      { "x-forwarded-host": "referencer.pages.dev" },
      PAGES_ENV,
    );
    expect(getPreviewOrigin(c)).toBeNull();
  });

  it("returns null when no x-forwarded-host header", () => {
    const c = mockContext({ host: "referencer.pages.dev" }, PAGES_ENV);
    expect(getPreviewOrigin(c)).toBeNull();
  });

  it("returns null for a suffix-attack domain", () => {
    const c = mockContext(
      { "x-forwarded-host": "evil.referencer.pages.dev.attacker.com" },
      PAGES_ENV,
    );
    expect(getPreviewOrigin(c)).toBeNull();
  });
});

describe("isAllowedOrigin", () => {
  it("returns true for the exact FRONTEND_URL", () => {
    expect(isAllowedOrigin("https://referencer.pages.dev", PAGES_ENV)).toBe(true);
  });

  it("returns true for a preview subdomain origin", () => {
    expect(
      isAllowedOrigin("https://abc123.referencer.pages.dev", PAGES_ENV),
    ).toBe(true);
  });

  it("returns false for an unrelated domain", () => {
    expect(isAllowedOrigin("https://evil.com", PAGES_ENV)).toBe(false);
  });

  it("returns false for a suffix-attack domain", () => {
    expect(
      isAllowedOrigin(
        "https://evil.referencer.pages.dev.attacker.com",
        PAGES_ENV,
      ),
    ).toBe(false);
  });

  it("returns false for invalid URL strings", () => {
    expect(isAllowedOrigin("not-a-url", PAGES_ENV)).toBe(false);
  });

  it("returns false when no FRONTEND_URL", () => {
    expect(isAllowedOrigin("https://referencer.pages.dev", {})).toBe(false);
  });
});
