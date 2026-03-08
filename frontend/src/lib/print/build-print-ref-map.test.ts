import { describe, it, expect } from "vitest";
import { buildPrintRefMap } from "./build-print-ref-map";
import type { Layer } from "@/types/editor";

describe("buildPrintRefMap", () => {
  it("numbers comments sequentially across layers", () => {
    const layers: Layer[] = [
      {
        id: "l1",
        name: "Layer 1",
        color: "#f00",
        visible: true,
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "hello",
            annotation: "note",
            type: "comment",
            visible: true,
          },
          {
            id: "h2",
            editorIndex: 0,
            from: 10,
            to: 15,
            text: "world",
            annotation: "note2",
            type: "comment",
            visible: true,
          },
        ],
        arrows: [],
        underlines: [],
      },
    ];
    const result = buildPrintRefMap(layers, [true]);
    expect(result.commentRefs.get("h1")).toBe(1);
    expect(result.commentRefs.get("h2")).toBe(2);
  });

  it("skips invisible layers", () => {
    const layers: Layer[] = [
      {
        id: "l1",
        name: "Layer 1",
        color: "#f00",
        visible: false,
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "hello",
            annotation: "note",
            type: "comment",
            visible: true,
          },
        ],
        arrows: [],
        underlines: [],
      },
    ];
    const result = buildPrintRefMap(layers, [true]);
    expect(result.commentRefs.size).toBe(0);
  });

  it("skips comments in hidden sections", () => {
    const layers: Layer[] = [
      {
        id: "l1",
        name: "Layer 1",
        color: "#f00",
        visible: true,
        highlights: [
          {
            id: "h1",
            editorIndex: 1,
            from: 0,
            to: 5,
            text: "hello",
            annotation: "note",
            type: "comment",
            visible: true,
          },
        ],
        arrows: [],
        underlines: [],
      },
    ];
    const result = buildPrintRefMap(layers, [true, false]);
    expect(result.commentRefs.size).toBe(0);
  });

  it("numbers arrows sequentially", () => {
    const layers: Layer[] = [
      {
        id: "l1",
        name: "Layer 1",
        color: "#f00",
        visible: true,
        highlights: [],
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 5, text: "from" },
            to: { editorIndex: 0, from: 10, to: 15, text: "to" },
            visible: true,
          },
          {
            id: "a2",
            from: { editorIndex: 0, from: 20, to: 25, text: "from2" },
            to: { editorIndex: 0, from: 30, to: 35, text: "to2" },
            visible: true,
          },
        ],
        underlines: [],
      },
    ];
    const result = buildPrintRefMap(layers, [true]);
    expect(result.arrowRefs.get("a1")).toBe(1);
    expect(result.arrowRefs.get("a2")).toBe(2);
  });

  it("returns empty maps for empty layers", () => {
    const result = buildPrintRefMap([], [true]);
    expect(result.commentRefs.size).toBe(0);
    expect(result.arrowRefs.size).toBe(0);
  });

  it("skips arrows when either endpoint section is hidden", () => {
    const layers: Layer[] = [
      {
        id: "l1",
        name: "Layer 1",
        color: "#f00",
        visible: true,
        highlights: [],
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 5, text: "from" },
            to: { editorIndex: 1, from: 10, to: 15, text: "to" },
            visible: true,
          },
        ],
        underlines: [],
      },
    ];
    const result = buildPrintRefMap(layers, [true, false]);
    expect(result.arrowRefs.size).toBe(0);
  });

  it("does not number highlight-type annotations", () => {
    const layers: Layer[] = [
      {
        id: "l1",
        name: "Layer 1",
        color: "#f00",
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
        arrows: [],
        underlines: [],
      },
    ];
    const result = buildPrintRefMap(layers, [true]);
    expect(result.commentRefs.size).toBe(0);
  });
});
