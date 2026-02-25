import { describe, it, expect, vi } from "vitest";
import { randomKSUID } from "./ksuid";

describe("randomKSUID", () => {
  describe("when called", () => {
    it("returns a 27-character string", () => {
      const id = randomKSUID();
      expect(id).toHaveLength(27);
    });

    it("contains only base62 characters", () => {
      const id = randomKSUID();
      expect(id).toMatch(/^[0-9A-Za-z]{27}$/);
    });
  });

  describe("when called multiple times", () => {
    it("produces unique IDs", () => {
      const ids = new Set(Array.from({ length: 50 }, () => randomKSUID()));
      expect(ids.size).toBe(50);
    });
  });

  describe("when called at different times", () => {
    it("produces lexicographically ordered IDs", () => {
      const id1 = randomKSUID();

      // Advance time by 2 seconds so the timestamp component differs
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 2000);
      const id2 = randomKSUID();
      vi.useRealTimers();

      expect(id2 > id1).toBe(true);
    });
  });
});
