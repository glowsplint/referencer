import { describe, it, expect, vi, afterEach } from "vitest";
import { formatRelativeTime } from "./format-relative-time";

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for timestamps less than a minute ago", () => {
    expect(formatRelativeTime(Date.now())).toBe("just now");
    expect(formatRelativeTime(Date.now() - 30_000)).toBe("just now");
  });

  it("returns minutes ago for timestamps less than an hour ago", () => {
    const fiveMinAgo = Date.now() - 5 * 60_000;
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago for timestamps less than a day ago", () => {
    const threeHoursAgo = Date.now() - 3 * 3_600_000;
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago for timestamps less than a week ago", () => {
    const twoDaysAgo = Date.now() - 2 * 86_400_000;
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });

  it("returns locale date string for timestamps older than a week", () => {
    const twoWeeksAgo = Date.now() - 14 * 86_400_000;
    const result = formatRelativeTime(twoWeeksAgo);
    expect(result).toBe(new Date(twoWeeksAgo).toLocaleDateString());
  });

  it("accepts ISO date strings", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("accepts ISO date strings for older dates", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });
});
