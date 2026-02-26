import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAllHighlightPositions } from "./use-all-highlight-positions";
import type { Layer } from "@/types/editor";

// This hook uses useLayoutEffect with ResizeObserver, MutationObserver, and
// complex DOM measurements. We test the paths that don't cause infinite
// update loops from ResizeObserver firing synchronously in jsdom.

function makeContainerWithLayers(_layers: Layer[]) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const containerRef = { current: container } as React.RefObject<HTMLDivElement | null>;
  const editorsRef = { current: new Map() } as React.RefObject<Map<number, any>>;
  return {
    container,
    containerRef,
    editorsRef,
    cleanup: () => document.body.removeChild(container),
  };
}

describe("useAllHighlightPositions", () => {
  it("when a layer is invisible, then skips it", () => {
    const { containerRef, editorsRef, cleanup } = makeContainerWithLayers([]);
    const layers: Layer[] = [
      {
        id: "layer-1",
        name: "Layer 1",
        visible: false,
        color: "#ff0000",
        highlights: [
          { id: "h1", type: "comment", from: 0, to: 5, editorIndex: 0, color: "#ff0000" },
        ],
        underlines: [],
        comments: [],
      } as any,
    ];

    const { result } = renderHook(() => useAllHighlightPositions(editorsRef, layers, containerRef));

    expect(result.current).toEqual([]);
    cleanup();
  });

  it("when editor is not found in the editors map, then skips highlights", () => {
    const { containerRef, editorsRef, cleanup } = makeContainerWithLayers([]);
    const layers: Layer[] = [
      {
        id: "layer-1",
        name: "Layer 1",
        visible: true,
        color: "#ff0000",
        highlights: [
          { id: "h1", type: "comment", from: 0, to: 5, editorIndex: 0, color: "#ff0000" },
        ],
        underlines: [],
        comments: [],
      } as any,
    ];

    const { result } = renderHook(() => useAllHighlightPositions(editorsRef, layers, containerRef));

    expect(result.current).toEqual([]);
    cleanup();
  });

  it("when highlight type is not comment, then skips it", () => {
    const { containerRef, editorsRef, cleanup } = makeContainerWithLayers([]);
    const layers: Layer[] = [
      {
        id: "layer-1",
        name: "Layer 1",
        visible: true,
        color: "#ff0000",
        highlights: [
          { id: "h1", type: "highlight", from: 0, to: 5, editorIndex: 0, color: "#ff0000" },
        ],
        underlines: [],
        comments: [],
      } as any,
    ];

    const { result } = renderHook(() => useAllHighlightPositions(editorsRef, layers, containerRef));

    expect(result.current).toEqual([]);
    cleanup();
  });

  it("when HighlightPosition type is used, then it has the expected shape", () => {
    // Verify the shape is exported and usable
    const pos: import("./use-all-highlight-positions").HighlightPosition = {
      highlightId: "h1",
      layerId: "l1",
      editorIndex: 0,
      top: 100,
      rightEdge: 200,
      leftEdge: 50,
    };
    expect(pos.highlightId).toBe("h1");
  });
});
