import { describe, it, expect } from "bun:test";
import { getClientIp } from "./client-ip";

function mockContext(headers: Record<string, string>) {
  return {
    req: {
      header(name: string) {
        return headers[name];
      },
    },
  };
}

describe("getClientIp", () => {
  it("returns x-real-client-ip when present", () => {
    const c = mockContext({
      "x-real-client-ip": "1.2.3.4",
      "cf-connecting-ip": "5.6.7.8",
    });
    expect(getClientIp(c)).toBe("1.2.3.4");
  });

  it("falls back to cf-connecting-ip when x-real-client-ip is absent", () => {
    const c = mockContext({
      "cf-connecting-ip": "5.6.7.8",
      "x-forwarded-for": "9.0.1.2",
    });
    expect(getClientIp(c)).toBe("5.6.7.8");
  });

  it("falls back to first x-forwarded-for entry", () => {
    const c = mockContext({
      "x-forwarded-for": "10.0.0.1, 10.0.0.2, 10.0.0.3",
    });
    expect(getClientIp(c)).toBe("10.0.0.1");
  });

  it("falls back to x-real-ip", () => {
    const c = mockContext({
      "x-real-ip": "192.168.1.1",
    });
    expect(getClientIp(c)).toBe("192.168.1.1");
  });

  it('returns "unknown" when no IP headers are present', () => {
    const c = mockContext({});
    expect(getClientIp(c)).toBe("unknown");
  });

  it("trims whitespace from x-forwarded-for entries", () => {
    const c = mockContext({
      "x-forwarded-for": "  10.0.0.1 , 10.0.0.2",
    });
    expect(getClientIp(c)).toBe("10.0.0.1");
  });
});
