import { describe, it, expect } from "vitest";
import { isValidPosition } from "./nodes";

describe("isValidPosition", () => {
  describe("when position is a positive number", () => {
    it("returns true", () => {
      expect(isValidPosition(5)).toBe(true);
    });
  });

  describe("when position is zero", () => {
    it("returns true", () => {
      expect(isValidPosition(0)).toBe(true);
    });
  });

  describe("when position is null", () => {
    it("returns false", () => {
      expect(isValidPosition(null)).toBe(false);
    });
  });

  describe("when position is undefined", () => {
    it("returns false", () => {
      expect(isValidPosition(undefined)).toBe(false);
    });
  });

  describe("when position is negative", () => {
    it("returns false", () => {
      expect(isValidPosition(-1)).toBe(false);
    });
  });

  describe("when position is NaN", () => {
    it("returns false", () => {
      expect(isValidPosition(NaN)).toBe(false);
    });
  });
});
