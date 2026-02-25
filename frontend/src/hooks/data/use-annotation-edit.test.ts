import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnnotationEdit } from "./use-annotation-edit";
import type { Layer } from "@/types/editor";

const mockLayers: Layer[] = [
  {
    id: "layer-1",
    name: "Layer 1",
    color: "#ff0000",
    visible: true,
    highlights: [
      {
        id: "h1",
        editorIndex: 0,
        from: 0,
        to: 5,
        text: "hello",
        annotation: "existing note",
        type: "comment",
        visible: true,
      },
    ],
    arrows: [],
    underlines: [],
  },
];

function createArgs(layersOverride?: Layer[]) {
  return {
    layers: layersOverride ?? mockLayers,
    removeHighlight: vi.fn(),
    updateHighlightAnnotation: vi.fn(),
    history: { record: vi.fn() },
  };
}

describe("useAnnotationEdit", () => {
  it("when handleAnnotationClick is called, then sets editing state and caches pre-edit content", () => {
    const args = createArgs();
    const { result } = renderHook(() => useAnnotationEdit(args));

    act(() => {
      result.current.handleAnnotationClick("layer-1", "h1");
    });

    expect(result.current.editingAnnotation).toEqual({
      layerId: "layer-1",
      highlightId: "h1",
    });
  });

  it("when handleAnnotationBlur is called with empty annotation, then removes the highlight", () => {
    const args = createArgs();
    const { result } = renderHook(() => useAnnotationEdit(args));

    // First click to set up editing state
    act(() => {
      result.current.handleAnnotationClick("layer-1", "h1");
    });

    // Blur with empty annotation
    act(() => {
      result.current.handleAnnotationBlur("layer-1", "h1", "");
    });

    expect(args.removeHighlight).toHaveBeenCalledWith("layer-1", "h1");
    expect(result.current.editingAnnotation).toBeNull();
  });

  it("when handleAnnotationBlur is called with HTML-only annotation, then removes the highlight", () => {
    const args = createArgs();
    const { result } = renderHook(() => useAnnotationEdit(args));

    act(() => {
      result.current.handleAnnotationClick("layer-1", "h1");
    });

    act(() => {
      result.current.handleAnnotationBlur("layer-1", "h1", "<p>  </p>");
    });

    expect(args.removeHighlight).toHaveBeenCalledWith("layer-1", "h1");
  });

  it("when handleAnnotationBlur is called with changed annotation, then records in history", () => {
    const args = createArgs();
    const { result } = renderHook(() => useAnnotationEdit(args));

    // Click to cache "existing note"
    act(() => {
      result.current.handleAnnotationClick("layer-1", "h1");
    });

    // Blur with different content
    act(() => {
      result.current.handleAnnotationBlur("layer-1", "h1", "updated note");
    });

    expect(args.history.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "updateAnnotation",
        description: expect.stringContaining("updated note"),
      }),
    );
    expect(result.current.editingAnnotation).toBeNull();

    // Verify undo/redo callbacks
    const recordCall = args.history.record.mock.calls[0][0];
    recordCall.undo();
    expect(args.updateHighlightAnnotation).toHaveBeenCalledWith("layer-1", "h1", "existing note");
    recordCall.redo();
    expect(args.updateHighlightAnnotation).toHaveBeenCalledWith("layer-1", "h1", "updated note");
  });

  it("when handleAnnotationBlur is called with unchanged text, then skips history", () => {
    const args = createArgs();
    const { result } = renderHook(() => useAnnotationEdit(args));

    // Click to cache "existing note"
    act(() => {
      result.current.handleAnnotationClick("layer-1", "h1");
    });

    // Blur with same text
    act(() => {
      result.current.handleAnnotationBlur("layer-1", "h1", "existing note");
    });

    expect(args.history.record).not.toHaveBeenCalled();
    expect(args.removeHighlight).not.toHaveBeenCalled();
    expect(result.current.editingAnnotation).toBeNull();
  });

  it("when onHighlightAdded is called, then sets editing state with empty pre-edit cache", () => {
    const args = createArgs();
    const { result } = renderHook(() => useAnnotationEdit(args));

    act(() => {
      result.current.onHighlightAdded("layer-1", "h2");
    });

    expect(result.current.editingAnnotation).toEqual({
      layerId: "layer-1",
      highlightId: "h2",
    });

    // Blur with new content — since pre-edit was empty, should record
    act(() => {
      result.current.handleAnnotationBlur("layer-1", "h2", "new note");
    });

    expect(args.history.record).toHaveBeenCalled();
  });

  it("when handleAnnotationClick is called for a missing highlight, then caches empty string", () => {
    const args = createArgs();
    const { result } = renderHook(() => useAnnotationEdit(args));

    // Click on a highlight that doesn't exist in the layer
    act(() => {
      result.current.handleAnnotationClick("layer-1", "nonexistent");
    });

    expect(result.current.editingAnnotation).toEqual({
      layerId: "layer-1",
      highlightId: "nonexistent",
    });

    // Blur with content — pre-edit was "", so this counts as a change
    act(() => {
      result.current.handleAnnotationBlur("layer-1", "nonexistent", "something");
    });

    expect(args.history.record).toHaveBeenCalled();
  });
});
