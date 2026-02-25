import { describe, it, expect } from "vitest";
import { captureVisibilitySnapshot, computeDelta } from "./use-recordings";
import type { Layer } from "@/types/editor";
import type { VisibilitySnapshot } from "@/types/recording";

function createLayer(overrides?: Partial<Layer>): Layer {
  return {
    id: "layer-1",
    name: "Layer 1",
    color: "#ff0000",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
    ...overrides,
  };
}

describe("captureVisibilitySnapshot", () => {
  it("when layers and section visibility are provided, then creates correct snapshot", () => {
    const layers: Layer[] = [
      createLayer({
        id: "layer-1",
        visible: true,
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "hello",
            annotation: "",
            type: "highlight",
            visible: true,
          },
        ],
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 3, text: "foo" },
            to: { editorIndex: 0, from: 10, to: 13, text: "bar" },
            visible: false,
          },
        ],
        underlines: [{ id: "u1", editorIndex: 0, from: 0, to: 5, text: "hello", visible: true }],
      }),
      createLayer({
        id: "layer-2",
        visible: false,
        highlights: [],
        arrows: [],
        underlines: [],
      }),
    ];
    const sectionVisibility = { 0: true, 1: false };

    const snapshot = captureVisibilitySnapshot(layers, sectionVisibility);

    expect(snapshot.layers).toEqual({ "layer-1": true, "layer-2": false });
    expect(snapshot.annotations).toEqual({
      "highlight:layer-1:h1": true,
      "arrow:layer-1:a1": false,
      "underline:layer-1:u1": true,
    });
    expect(snapshot.sections).toEqual({ 0: true, 1: false });
  });

  it("when layers and sections are empty, then handles gracefully", () => {
    const snapshot = captureVisibilitySnapshot([], {});
    expect(snapshot.layers).toEqual({});
    expect(snapshot.annotations).toEqual({});
    expect(snapshot.sections).toEqual({});
  });
});

describe("computeDelta", () => {
  it("when a layer visibility changes, then detects it", () => {
    const prev: VisibilitySnapshot = {
      layers: { "layer-1": true, "layer-2": false },
      annotations: {},
      sections: {},
    };
    const curr: VisibilitySnapshot = {
      layers: { "layer-1": false, "layer-2": false },
      annotations: {},
      sections: {},
    };

    const delta = computeDelta(prev, curr);
    expect(delta).toEqual({ "layer:layer-1": false });
  });

  it("when an annotation visibility changes, then detects it", () => {
    const prev: VisibilitySnapshot = {
      layers: {},
      annotations: { "highlight:layer-1:h1": true, "arrow:layer-1:a1": true },
      sections: {},
    };
    const curr: VisibilitySnapshot = {
      layers: {},
      annotations: { "highlight:layer-1:h1": false, "arrow:layer-1:a1": true },
      sections: {},
    };

    const delta = computeDelta(prev, curr);
    expect(delta).toEqual({ "highlight:layer-1:h1": false });
  });

  it("when a section visibility changes, then detects it", () => {
    const prev: VisibilitySnapshot = {
      layers: {},
      annotations: {},
      sections: { 0: true, 1: true },
    };
    const curr: VisibilitySnapshot = {
      layers: {},
      annotations: {},
      sections: { 0: true, 1: false },
    };

    const delta = computeDelta(prev, curr);
    expect(delta).toEqual({ "section:1": false });
  });

  it("when layers are removed, then detects them as hidden", () => {
    const prev: VisibilitySnapshot = {
      layers: { "layer-1": true, "layer-2": true },
      annotations: {},
      sections: {},
    };
    const curr: VisibilitySnapshot = {
      layers: { "layer-1": true },
      annotations: {},
      sections: {},
    };

    const delta = computeDelta(prev, curr);
    expect(delta).toEqual({ "layer:layer-2": false });
  });

  it("when annotations are removed, then detects them as hidden", () => {
    const prev: VisibilitySnapshot = {
      layers: {},
      annotations: { "highlight:layer-1:h1": true, "arrow:layer-1:a1": true },
      sections: {},
    };
    const curr: VisibilitySnapshot = {
      layers: {},
      annotations: { "highlight:layer-1:h1": true },
      sections: {},
    };

    const delta = computeDelta(prev, curr);
    expect(delta).toEqual({ "arrow:layer-1:a1": false });
  });

  it("when nothing changed, then returns empty object", () => {
    const snapshot: VisibilitySnapshot = {
      layers: { "layer-1": true },
      annotations: { "highlight:layer-1:h1": true },
      sections: { 0: true },
    };

    const delta = computeDelta(snapshot, snapshot);
    expect(delta).toEqual({});
  });

  it("when multiple changes occur at once, then detects all of them", () => {
    const prev: VisibilitySnapshot = {
      layers: { "layer-1": true, "layer-2": false },
      annotations: { "highlight:layer-1:h1": true },
      sections: { 0: true },
    };
    const curr: VisibilitySnapshot = {
      layers: { "layer-1": false, "layer-2": true },
      annotations: { "highlight:layer-1:h1": false },
      sections: { 0: false },
    };

    const delta = computeDelta(prev, curr);
    expect(delta).toEqual({
      "layer:layer-1": false,
      "layer:layer-2": true,
      "highlight:layer-1:h1": false,
      "section:0": false,
    });
  });

  it("when new layers appear, then detects them as changed", () => {
    const prev: VisibilitySnapshot = {
      layers: {},
      annotations: {},
      sections: {},
    };
    const curr: VisibilitySnapshot = {
      layers: { "layer-1": true },
      annotations: {},
      sections: {},
    };

    const delta = computeDelta(prev, curr);
    expect(delta).toEqual({ "layer:layer-1": true });
  });
});
