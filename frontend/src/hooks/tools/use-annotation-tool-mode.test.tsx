import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useAnnotationToolMode,
  type AnnotationToolConfig,
  type AnnotationItem,
  type UseAnnotationToolModeOptions,
} from "./use-annotation-tool-mode";
import type { ActiveTool, WordSelection } from "@/types/editor";

interface TestItem extends AnnotationItem {
  annotation: string;
}

interface TestLayer {
  id: string;
  items: TestItem[];
}

const testConfig: AnnotationToolConfig<TestLayer> = {
  toolName: "highlight",
  i18nKey: "highlight",
  getItems: (layer) => layer.items,
  findExisting: (items, sel) =>
    items.find(
      (h) =>
        h.editorIndex === sel.editorIndex &&
        ((h.from === sel.from && h.to === sel.to) || h.text === sel.text),
    ),
  buildPayload: (sel: WordSelection) => ({
    editorIndex: sel.editorIndex,
    from: sel.from,
    to: sel.to,
    text: sel.text,
    annotation: "",
  }),
};

function createOptions(
  overrides: Partial<UseAnnotationToolModeOptions<TestLayer>> = {},
): UseAnnotationToolModeOptions<TestLayer> {
  return {
    config: testConfig,
    isLocked: true,
    activeTool: "highlight" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addLayer: vi.fn(() => "auto-layer-1"),
    layers: [] as TestLayer[],
    addItem: vi.fn().mockReturnValue("item-1"),
    removeItem: vi.fn(),
    setStatus: vi.fn(),
    flashStatus: vi.fn(),
    clearStatus: vi.fn(),
    addedText: "Item added.",
    removedText: "Item removed.",
    ...overrides,
  };
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" };

describe("useAnnotationToolMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when tool is activated", () => {
    it("then shows an info status prompting the user to select words", () => {
      const setStatus = vi.fn();
      renderHook(() => useAnnotationToolMode(createOptions({ setStatus })));

      expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
    });
  });

  describe("when deactivating", () => {
    it("when switching back to selection mode, then clears the status message", () => {
      const clearStatus = vi.fn();
      const { rerender } = renderHook(
        (props: { activeTool: ActiveTool }) =>
          useAnnotationToolMode(createOptions({ activeTool: props.activeTool, clearStatus })),
        { initialProps: { activeTool: "highlight" as ActiveTool } },
      );

      rerender({ activeTool: "selection" });
      expect(clearStatus).toHaveBeenCalled();
    });

    it("when switching to another locked tool, then does not clear status so the new tool can set its own", () => {
      const clearStatus = vi.fn();
      const { rerender } = renderHook(
        (props: { activeTool: ActiveTool }) =>
          useAnnotationToolMode(createOptions({ activeTool: props.activeTool, clearStatus })),
        { initialProps: { activeTool: "highlight" as ActiveTool } },
      );

      rerender({ activeTool: "arrow" });
      expect(clearStatus).not.toHaveBeenCalled();
    });

    it("when the toolbar is unlocked, then clears the status message", () => {
      const clearStatus = vi.fn();
      const { rerender } = renderHook(
        (props: { isLocked: boolean }) =>
          useAnnotationToolMode(createOptions({ isLocked: props.isLocked, clearStatus })),
        { initialProps: { isLocked: true } },
      );

      rerender({ isLocked: false });
      expect(clearStatus).toHaveBeenCalled();
    });
  });

  describe("when confirming a selection", () => {
    it("when a different tool is active, then does not create an annotation", () => {
      const opts = createOptions({ activeTool: "selection", selection: word1 });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(opts.addItem).not.toHaveBeenCalled();
    });

    it("when the toolbar is not locked, then does not create an annotation", () => {
      const opts = createOptions({ isLocked: false, selection: word1 });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(opts.addItem).not.toHaveBeenCalled();
    });

    it("when there is no text selection, then does not create an annotation", () => {
      const opts = createOptions({ selection: null });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(opts.addItem).not.toHaveBeenCalled();
    });

    it("then creates an item using the payload from buildPayload", () => {
      const addItem = vi.fn().mockReturnValue("item-1");
      const opts = createOptions({ selection: word1, addItem: addItem });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(addItem).toHaveBeenCalledWith("layer-1", {
        editorIndex: 0,
        from: 1,
        to: 5,
        text: "hello",
        annotation: "",
      });
    });

    it("then flashes an added toast when addedText is configured", () => {
      const flashStatus = vi.fn();
      const opts = createOptions({ selection: word1, flashStatus, addedText: "Added!" });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(flashStatus).toHaveBeenCalledWith({ text: "Added!", type: "success" }, 3000);
    });

    it("then calls onItemAdded with the layer and new item IDs", () => {
      const onItemAdded = vi.fn();
      const addItem = vi.fn().mockReturnValue("new-item-1");
      const opts = createOptions({
        selection: word1,
        onItemAdded,
        addItem: addItem,
      });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(onItemAdded).toHaveBeenCalledWith("layer-1", "new-item-1");
    });

    it("when config includes preConfirm, then calls it before adding or removing items", () => {
      const preConfirm = vi.fn();
      const configWithPreConfirm = { ...testConfig, preConfirm };
      const opts = createOptions({
        config: configWithPreConfirm,
        selection: word1,
        layers: [{ id: "layer-1", items: [] }],
      });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(preConfirm).toHaveBeenCalledWith("layer-1", { id: "layer-1", items: [] });
    });
  });

  describe("when toggling an existing item", () => {
    it("when the same range is selected, then removes the existing item instead of adding", () => {
      const removeItem = vi.fn();
      const opts = createOptions({
        selection: word1,
        removeItem,
        layers: [
          {
            id: "layer-1",
            items: [
              {
                id: "item-existing",
                editorIndex: 0,
                from: 1,
                to: 5,
                text: "hello",
                annotation: "",
              },
            ],
          },
        ],
      });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(removeItem).toHaveBeenCalledWith("layer-1", "item-existing");
      expect(opts.addItem).not.toHaveBeenCalled();
    });

    it("then flashes a removed toast when removedText is configured", () => {
      const flashStatus = vi.fn();
      const opts = createOptions({
        selection: word1,
        flashStatus,
        removedText: "Removed!",
        layers: [
          {
            id: "layer-1",
            items: [
              {
                id: "item-existing",
                editorIndex: 0,
                from: 1,
                to: 5,
                text: "hello",
                annotation: "",
              },
            ],
          },
        ],
      });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(flashStatus).toHaveBeenCalledWith({ text: "Removed!", type: "success" }, 3000);
    });

    it("when removing an item without a configured removal message, then no toast appears", () => {
      const flashStatus = vi.fn();
      const opts = createOptions({
        selection: word1,
        flashStatus,
        removedText: undefined,
        layers: [
          {
            id: "layer-1",
            items: [
              {
                id: "item-existing",
                editorIndex: 0,
                from: 1,
                to: 5,
                text: "hello",
                annotation: "",
              },
            ],
          },
        ],
      });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(flashStatus).not.toHaveBeenCalled();
    });

    it("when positions differ but text matches (CRDT divergence), then still removes the existing item", () => {
      const removeItem = vi.fn();
      const sel: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "hello" };
      const opts = createOptions({
        selection: sel,
        removeItem,
        layers: [
          {
            id: "layer-1",
            items: [
              { id: "item-1", editorIndex: 0, from: 1, to: 5, text: "hello", annotation: "" },
            ],
          },
        ],
      });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(removeItem).toHaveBeenCalledWith("layer-1", "item-1");
    });
  });

  describe("when no layer exists", () => {
    it("then auto-creates a layer and adds the item to it", () => {
      const addLayer = vi.fn(() => "auto-layer-1");
      const addItem = vi.fn().mockReturnValue("item-1");
      const opts = createOptions({
        activeLayerId: null,
        addLayer,
        addItem: addItem,
        selection: word1,
      });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(addLayer).toHaveBeenCalled();
      expect(addItem).toHaveBeenCalledWith(
        "auto-layer-1",
        expect.objectContaining({ text: "hello" }),
      );
    });

    it("when addLayer fails and returns an empty string, then does not create an item", () => {
      const addLayer = vi.fn(() => "");
      const opts = createOptions({ activeLayerId: null, addLayer, selection: word1 });
      const { result } = renderHook(() => useAnnotationToolMode(opts));

      act(() => {
        result.current.confirm();
      });

      expect(addLayer).toHaveBeenCalled();
      expect(opts.addItem).not.toHaveBeenCalled();
    });
  });
});
