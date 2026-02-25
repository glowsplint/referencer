import { describe, it, expect } from "vitest";
import { describeDelta } from "./describe-delta";
import type { Layer } from "@/types/editor";

// Simple pass-through translation function that returns the key with interpolated values
function mockT(key: string, opts?: Record<string, unknown>): string {
  if (opts) {
    const parts = Object.entries(opts)
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${key}(${parts})`;
  }
  return key;
}

const layers: Layer[] = [
  { id: "layer-1", name: "Notes", color: "#ff0000" } as Layer,
  { id: "layer-2", name: "Questions", color: "#00ff00" } as Layer,
];

describe("describeDelta", () => {
  describe("when delta has a layer:show entry", () => {
    it("describes showing the layer by name", () => {
      const delta = { "layer:layer-1": true };
      const result = describeDelta(delta, layers, mockT);
      expect(result).toContain("recording.showLayer");
      expect(result).toContain("Notes");
    });
  });

  describe("when delta has a layer:hide entry", () => {
    it("describes hiding the layer by name", () => {
      const delta = { "layer:layer-2": false };
      const result = describeDelta(delta, layers, mockT);
      expect(result).toContain("recording.hideLayer");
      expect(result).toContain("Questions");
    });
  });

  describe("when delta references a missing layer", () => {
    it("falls back to 'Unknown' name", () => {
      const delta = { "layer:nonexistent": true };
      const result = describeDelta(delta, layers, mockT);
      expect(result).toContain("Unknown");
    });
  });

  describe("when delta has a section:show entry", () => {
    it("describes showing the section with 1-based index", () => {
      const delta = { "section:0": true };
      const result = describeDelta(delta, layers, mockT);
      expect(result).toContain("recording.showSection");
      expect(result).toContain("index=1");
    });
  });

  describe("when delta has a section:hide entry", () => {
    it("describes hiding the section", () => {
      const delta = { "section:2": false };
      const result = describeDelta(delta, layers, mockT);
      expect(result).toContain("recording.hideSection");
      expect(result).toContain("index=3");
    });
  });

  describe("when delta has an annotation entry", () => {
    it("describes showing annotation for true", () => {
      const delta = { "annotation-key": true };
      const result = describeDelta(delta, layers, mockT);
      expect(result).toContain("recording.showAnnotation");
    });

    it("describes hiding annotation for false", () => {
      const delta = { "annotation-key": false };
      const result = describeDelta(delta, layers, mockT);
      expect(result).toContain("recording.hideAnnotation");
    });
  });

  describe("when delta has multiple entries", () => {
    it("joins descriptions with comma", () => {
      const delta = { "layer:layer-1": true, "section:0": false };
      const result = describeDelta(delta, layers, mockT);
      expect(result).toContain(", ");
    });
  });

  describe("when delta is empty", () => {
    it("returns 'No changes'", () => {
      const result = describeDelta({}, layers, mockT);
      expect(result).toBe("No changes");
    });
  });
});
