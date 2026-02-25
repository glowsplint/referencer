import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnnotationEdit } from "./use-annotation-edit";
import type { Layer } from "@/types/editor";

vi.mock("@/lib/is-annotation-empty", () => ({
  isAnnotationEmpty: (html: string) => !html?.replace(/<[^>]*>/g, "").trim(),
}));

function makeDeps(layers: Layer[] = []) {
  return {
    layers,
    removeHighlight: vi.fn(),
    updateHighlightAnnotation: vi.fn(),
    history: { record: vi.fn() },
  };
}

function makeLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "layer-1",
    name: "Layer 1",
    color: "#ff0000",
    visible: true,
    highlights: [],
    arrows: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAnnotationEdit", () => {
  describe("when initially rendered", () => {
    it("returns null editingAnnotation", () => {
      const deps = makeDeps();
      const { result } = renderHook(() => useAnnotationEdit(deps));
      expect(result.current.editingAnnotation).toBeNull();
    });
  });

  describe("when onHighlightAdded is called", () => {
    it("sets editingAnnotation to the given layer and highlight", () => {
      const deps = makeDeps();
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.onHighlightAdded("layer-1", "hl-1");
      });

      expect(result.current.editingAnnotation).toEqual({
        layerId: "layer-1",
        highlightId: "hl-1",
      });
    });
  });

  describe("when handleAnnotationClick is called", () => {
    it("sets editingAnnotation and stores the current annotation text", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "hl-1",
            editorIndex: 0,
            from: 1,
            to: 5,
            text: "hello",
            type: "comment",
            annotation: "existing note",
          },
        ],
      });
      const deps = makeDeps([layer]);
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.handleAnnotationClick("layer-1", "hl-1");
      });

      expect(result.current.editingAnnotation).toEqual({
        layerId: "layer-1",
        highlightId: "hl-1",
      });
    });

    it("stores empty string when highlight is not found", () => {
      const deps = makeDeps([makeLayer()]);
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.handleAnnotationClick("layer-1", "non-existent");
      });

      expect(result.current.editingAnnotation).toEqual({
        layerId: "layer-1",
        highlightId: "non-existent",
      });
    });
  });

  describe("when handleAnnotationBlur is called with empty annotation", () => {
    it("removes the highlight", () => {
      const deps = makeDeps();
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.handleAnnotationBlur("layer-1", "hl-1", "");
      });

      expect(deps.removeHighlight).toHaveBeenCalledWith("layer-1", "hl-1");
    });

    it("removes the highlight for whitespace-only annotation", () => {
      const deps = makeDeps();
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.handleAnnotationBlur("layer-1", "hl-1", "   ");
      });

      expect(deps.removeHighlight).toHaveBeenCalledWith("layer-1", "hl-1");
    });

    it("removes the highlight for HTML-only annotation", () => {
      const deps = makeDeps();
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.handleAnnotationBlur("layer-1", "hl-1", "<p></p>");
      });

      expect(deps.removeHighlight).toHaveBeenCalledWith("layer-1", "hl-1");
    });

    it("clears editingAnnotation", () => {
      const deps = makeDeps();
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.onHighlightAdded("layer-1", "hl-1");
      });
      act(() => {
        result.current.handleAnnotationBlur("layer-1", "hl-1", "");
      });

      expect(result.current.editingAnnotation).toBeNull();
    });
  });

  describe("when handleAnnotationBlur is called with non-empty annotation", () => {
    it("records a history entry when text changed", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "hl-1",
            editorIndex: 0,
            from: 1,
            to: 5,
            text: "hello",
            type: "comment",
            annotation: "old note",
          },
        ],
      });
      const deps = makeDeps([layer]);
      const { result } = renderHook(() => useAnnotationEdit(deps));

      // Click to start editing (stores old text)
      act(() => {
        result.current.handleAnnotationClick("layer-1", "hl-1");
      });
      // Blur with new text
      act(() => {
        result.current.handleAnnotationBlur("layer-1", "hl-1", "new note");
      });

      expect(deps.history.record).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "updateAnnotation",
          description: expect.stringContaining("new note"),
        }),
      );
    });

    it("does not record history when text is unchanged", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "hl-1",
            editorIndex: 0,
            from: 1,
            to: 5,
            text: "hello",
            type: "comment",
            annotation: "same note",
          },
        ],
      });
      const deps = makeDeps([layer]);
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.handleAnnotationClick("layer-1", "hl-1");
      });
      act(() => {
        result.current.handleAnnotationBlur("layer-1", "hl-1", "same note");
      });

      expect(deps.history.record).not.toHaveBeenCalled();
    });

    it("truncates long annotations in the history description", () => {
      const deps = makeDeps([makeLayer()]);
      const { result } = renderHook(() => useAnnotationEdit(deps));

      // Start with empty (from onHighlightAdded)
      act(() => {
        result.current.onHighlightAdded("layer-1", "hl-1");
      });
      const longText = "a".repeat(100);
      act(() => {
        result.current.handleAnnotationBlur("layer-1", "hl-1", longText);
      });

      const recordCall = deps.history.record.mock.calls[0][0];
      expect(recordCall.description).toContain("...");
    });

    it("provides working undo/redo callbacks", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "hl-1",
            editorIndex: 0,
            from: 1,
            to: 5,
            text: "hello",
            type: "comment",
            annotation: "old",
          },
        ],
      });
      const deps = makeDeps([layer]);
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.handleAnnotationClick("layer-1", "hl-1");
      });
      act(() => {
        result.current.handleAnnotationBlur("layer-1", "hl-1", "new");
      });

      const recordCall = deps.history.record.mock.calls[0][0];

      // Execute undo
      recordCall.undo();
      expect(deps.updateHighlightAnnotation).toHaveBeenCalledWith("layer-1", "hl-1", "old");

      // Execute redo
      recordCall.redo();
      expect(deps.updateHighlightAnnotation).toHaveBeenCalledWith("layer-1", "hl-1", "new");
    });

    it("clears editingAnnotation", () => {
      const deps = makeDeps();
      const { result } = renderHook(() => useAnnotationEdit(deps));

      act(() => {
        result.current.onHighlightAdded("layer-1", "hl-1");
      });
      act(() => {
        result.current.handleAnnotationBlur("layer-1", "hl-1", "some text");
      });

      expect(result.current.editingAnnotation).toBeNull();
    });
  });
});
