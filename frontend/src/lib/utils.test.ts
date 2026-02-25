import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("when using cn", () => {
  it("then merges Tailwind classes", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("then resolves conflicting Tailwind utilities", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("then handles conditional classes", () => {
    expect(cn("base", undefined, "extra")).toBe("base extra");
  });

  it("then handles empty input", () => {
    expect(cn()).toBe("");
  });
});
