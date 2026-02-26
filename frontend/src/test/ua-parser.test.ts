import { describe, it, expect } from "vitest";
import { parseUserAgent } from "../../../backend/src/lib/ua-parser";

describe("parseUserAgent", () => {
  it("parses Chrome on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(parseUserAgent(ua)).toBe("Chrome 120 on Windows");
  });

  it("parses Chrome on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(parseUserAgent(ua)).toBe("Chrome 120 on macOS");
  });

  it("parses Firefox on Linux", () => {
    const ua = "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0";
    expect(parseUserAgent(ua)).toBe("Firefox 121 on Linux");
  });

  it("parses Safari on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
    expect(parseUserAgent(ua)).toBe("Safari 17 on macOS");
  });

  it("parses Edge on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
    expect(parseUserAgent(ua)).toBe("Edge 120 on Windows");
  });

  it("parses Mobile Chrome on Android", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36";
    expect(parseUserAgent(ua)).toBe("Chrome 120 on Android 14");
  });

  it("parses Mobile Safari on iOS", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
    expect(parseUserAgent(ua)).toBe("Safari 17 on iOS");
  });

  it("returns Unknown for empty string", () => {
    expect(parseUserAgent("")).toBe("Unknown browser on Unknown OS");
  });

  it("returns Unknown for unrecognized UA string", () => {
    expect(parseUserAgent("SomeRandomBot/1.0")).toBe("Unknown browser on Unknown OS");
  });

  it("parses Opera on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0";
    expect(parseUserAgent(ua)).toBe("Opera 106 on Windows");
  });

  it("parses Chrome on ChromeOS", () => {
    const ua =
      "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(parseUserAgent(ua)).toBe("Chrome 120 on ChromeOS");
  });

  it("parses iPadOS", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
    expect(parseUserAgent(ua)).toBe("Safari 17 on iPadOS");
  });
});
