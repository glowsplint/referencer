import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  describe("when called with a single class", () => {
    it("returns that class", () => {
      expect(cn("text-red-500")).toBe("text-red-500");
    });
  });

  describe("when called with multiple non-conflicting classes", () => {
    it("returns all classes joined", () => {
      const result = cn("text-red-500", "bg-blue-200");
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-200");
    });
  });

  describe("when called with conflicting tailwind classes", () => {
    it("resolves to the last class (tailwind-merge behavior)", () => {
      const result = cn("text-red-500", "text-blue-500");
      expect(result).toBe("text-blue-500");
    });
  });

  describe("when called with conditional classes via clsx syntax", () => {
    it("includes truthy classes and excludes falsy ones", () => {
      const result = cn("base", false && "hidden", "visible");
      expect(result).toContain("base");
      expect(result).toContain("visible");
      expect(result).not.toContain("hidden");
    });
  });

  describe("when called with no arguments", () => {
    it("returns empty string", () => {
      expect(cn()).toBe("");
    });
  });

  describe("when called with undefined and null values", () => {
    it("ignores them and returns valid classes", () => {
      const result = cn("active", undefined, null, "flex");
      expect(result).toContain("active");
      expect(result).toContain("flex");
    });
  });
});
