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
    addItem: vi.fn().mockReturnValue("item-1") as never,
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

  it("shows entry status when tool is activated", () => {
    const setStatus = vi.fn();
    renderHook(() => useAnnotationToolMode(createOptions({ setStatus })));

    expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("clears status when exiting tool to selection", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useAnnotationToolMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "highlight" as ActiveTool } },
    );

    rerender({ activeTool: "selection" });
    expect(clearStatus).toHaveBeenCalled();
  });

  it("does not clear status when switching to another locked tool", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useAnnotationToolMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "highlight" as ActiveTool } },
    );

    rerender({ activeTool: "arrow" });
    expect(clearStatus).not.toHaveBeenCalled();
  });

  it("clears status when unlocking", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useAnnotationToolMode(createOptions({ isLocked: props.isLocked, clearStatus })),
      { initialProps: { isLocked: true } },
    );

    rerender({ isLocked: false });
    expect(clearStatus).toHaveBeenCalled();
  });

  it("always shows entry status", () => {
    const setStatus = vi.fn();
    renderHook(() => useAnnotationToolMode(createOptions({ setStatus })));

    expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("does nothing when activeTool does not match", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 });
    const { result } = renderHook(() => useAnnotationToolMode(opts));

    act(() => {
      result.current.confirm();
    });

    expect(opts.addItem).not.toHaveBeenCalled();
  });

  it("does nothing when isLocked is false", () => {
    const opts = createOptions({ isLocked: false, selection: word1 });
    const { result } = renderHook(() => useAnnotationToolMode(opts));

    act(() => {
      result.current.confirm();
    });

    expect(opts.addItem).not.toHaveBeenCalled();
  });

  it("does nothing when there is no selection", () => {
    const opts = createOptions({ selection: null });
    const { result } = renderHook(() => useAnnotationToolMode(opts));

    act(() => {
      result.current.confirm();
    });

    expect(opts.addItem).not.toHaveBeenCalled();
  });

  it("auto-creates a layer when no active layer", () => {
    const addLayer = vi.fn(() => "auto-layer-1");
    const addItem = vi.fn().mockReturnValue("item-1");
    const opts = createOptions({
      activeLayerId: null,
      addLayer,
      addItem: addItem as never,
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

  it("does nothing when addLayer fails (returns empty string)", () => {
    const addLayer = vi.fn(() => "");
    const opts = createOptions({ activeLayerId: null, addLayer, selection: word1 });
    const { result } = renderHook(() => useAnnotationToolMode(opts));

    act(() => {
      result.current.confirm();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(opts.addItem).not.toHaveBeenCalled();
  });

  it("creates item with payload from buildPayload", () => {
    const addItem = vi.fn().mockReturnValue("item-1");
    const opts = createOptions({ selection: word1, addItem: addItem as never });
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

  it("toggles off existing item when same range selected", () => {
    const removeItem = vi.fn();
    const opts = createOptions({
      selection: word1,
      removeItem,
      layers: [
        {
          id: "layer-1",
          items: [
            { id: "item-existing", editorIndex: 0, from: 1, to: 5, text: "hello", annotation: "" },
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

  it("shows added toast when item is created", () => {
    const flashStatus = vi.fn();
    const opts = createOptions({ selection: word1, flashStatus, addedText: "Added!" });
    const { result } = renderHook(() => useAnnotationToolMode(opts));

    act(() => {
      result.current.confirm();
    });

    expect(flashStatus).toHaveBeenCalledWith({ text: "Added!", type: "success" }, 3000);
  });

  it("shows removed toast when item is toggled off", () => {
    const flashStatus = vi.fn();
    const opts = createOptions({
      selection: word1,
      flashStatus,
      removedText: "Removed!",
      layers: [
        {
          id: "layer-1",
          items: [
            { id: "item-existing", editorIndex: 0, from: 1, to: 5, text: "hello", annotation: "" },
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

  it("does not show removed toast when removedText is undefined", () => {
    const flashStatus = vi.fn();
    const opts = createOptions({
      selection: word1,
      flashStatus,
      removedText: undefined,
      layers: [
        {
          id: "layer-1",
          items: [
            { id: "item-existing", editorIndex: 0, from: 1, to: 5, text: "hello", annotation: "" },
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

  it("calls onItemAdded after creating item", () => {
    const onItemAdded = vi.fn();
    const addItem = vi.fn().mockReturnValue("new-item-1");
    const opts = createOptions({
      selection: word1,
      onItemAdded,
      addItem: addItem as never,
    });
    const { result } = renderHook(() => useAnnotationToolMode(opts));

    act(() => {
      result.current.confirm();
    });

    expect(onItemAdded).toHaveBeenCalledWith("layer-1", "new-item-1");
  });

  it("calls preConfirm before toggle check", () => {
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

  it("matches by text when positions differ (CRDT divergence)", () => {
    const removeItem = vi.fn();
    const sel: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "hello" };
    const opts = createOptions({
      selection: sel,
      removeItem,
      layers: [
        {
          id: "layer-1",
          items: [{ id: "item-1", editorIndex: 0, from: 1, to: 5, text: "hello", annotation: "" }],
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
