import { describe, it, expect } from "vitest";
import { describeDelta } from "./describe-delta";
import type { Layer } from "@/types/editor";

const mockLayers: Layer[] = [
  {
    id: "layer-1",
    name: "Layer 1",
    color: "#ff0000",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
  },
  {
    id: "layer-2",
    name: "Layer 2",
    color: "#00ff00",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
  },
];

const t = (key: string, opts?: Record<string, unknown>) => {
  const map: Record<string, string> = {
    "recording.showLayer": `Show layer '${opts?.name}'`,
    "recording.hideLayer": `Hide layer '${opts?.name}'`,
    "recording.showSection": `Show section ${opts?.index}`,
    "recording.hideSection": `Hide section ${opts?.index}`,
    "recording.showAnnotation": "Show annotation",
    "recording.hideAnnotation": "Hide annotation",
  };
  return map[key] ?? key;
};

describe("describeDelta", () => {
  it("describes showing a layer", () => {
    const result = describeDelta({ "layer:layer-1": true }, mockLayers, t);
    expect(result).toBe("Show layer 'Layer 1'");
  });

  it("describes hiding a layer", () => {
    const result = describeDelta({ "layer:layer-2": false }, mockLayers, t);
    expect(result).toBe("Hide layer 'Layer 2'");
  });

  it("describes showing a section", () => {
    const result = describeDelta({ "section:0": true }, mockLayers, t);
    expect(result).toBe("Show section 1");
  });

  it("describes hiding a section", () => {
    const result = describeDelta({ "section:1": false }, mockLayers, t);
    expect(result).toBe("Hide section 2");
  });

  it("describes showing an annotation", () => {
    const result = describeDelta({ "highlight:layer-1:h1": true }, mockLayers, t);
    expect(result).toBe("Show annotation");
  });

  it("describes hiding an annotation", () => {
    const result = describeDelta({ "highlight:layer-1:h1": false }, mockLayers, t);
    expect(result).toBe("Hide annotation");
  });

  it("joins multiple changes with commas", () => {
    const result = describeDelta(
      { "layer:layer-1": true, "section:0": false },
      mockLayers,
      t,
    );
    expect(result).toBe("Show layer 'Layer 1', Hide section 1");
  });

  it("returns 'No changes' for empty delta", () => {
    const result = describeDelta({}, mockLayers, t);
    expect(result).toBe("No changes");
  });

  it("uses 'Unknown' for missing layer", () => {
    const result = describeDelta({ "layer:nonexistent": true }, mockLayers, t);
    expect(result).toBe("Show layer 'Unknown'");
  });
});
