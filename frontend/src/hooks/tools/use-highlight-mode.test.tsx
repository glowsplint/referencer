import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHighlightMode } from "./use-highlight-mode";
import type { WordSelection, ActiveTool } from "@/types/editor";

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "highlight" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addLayer: vi.fn(() => "auto-layer-1"),
    layers: [] as {
      id: string;
      highlights: {
        id: string;
        editorIndex: number;
        from: number;
        to: number;
        text: string;
        annotation: string;
        type: "highlight" | "comment";
      }[];
    }[],
    addHighlight: vi.fn().mockReturnValue("h-1"),
    removeHighlight: vi.fn(),
    setStatus: vi.fn(),
    flashStatus: vi.fn(),
    clearStatus: vi.fn(),
    ...overrides,
  };
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" };

describe("useHighlightMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when highlight tool is activated, then shows entry status", () => {
    const setStatus = vi.fn();
    renderHook(() => useHighlightMode(createOptions({ setStatus })));

    expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("when exiting highlight tool, then clears status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useHighlightMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "highlight" as ActiveTool } },
    );

    rerender({ activeTool: "selection" });
    expect(clearStatus).toHaveBeenCalled();
  });

  it("when switching to another annotation tool, then does not clear status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useHighlightMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "highlight" as ActiveTool } },
    );

    rerender({ activeTool: "arrow" });
    expect(clearStatus).not.toHaveBeenCalled();
  });

  it("when unlocking while highlight tool is active, then clears status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useHighlightMode(createOptions({ isLocked: props.isLocked, clearStatus })),
      { initialProps: { isLocked: true } },
    );

    rerender({ isLocked: false });
    expect(clearStatus).toHaveBeenCalled();
  });

  it("when activeTool is not highlight, then does nothing", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when isLocked is false, then does nothing", () => {
    const opts = createOptions({ isLocked: false, selection: word1 });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when there is no selection, then does nothing", () => {
    const opts = createOptions({ selection: null });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when no active layer exists, then auto-creates one", () => {
    const addLayer = vi.fn(() => "auto-layer-1");
    const addHighlight = vi.fn().mockReturnValue("h-1");
    const opts = createOptions({ activeLayerId: null, addLayer, addHighlight, selection: word1 });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(addHighlight).toHaveBeenCalledWith("auto-layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
      annotation: "",
      type: "highlight",
    });
  });

  it("when addLayer fails (all colors used), then does nothing", () => {
    const addLayer = vi.fn(() => "");
    const opts = createOptions({ activeLayerId: null, addLayer, selection: word1 });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when a selection is confirmed, then creates highlight with empty annotation", () => {
    const opts = createOptions({ selection: word1 });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(opts.addHighlight).toHaveBeenCalledWith("layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
      annotation: "",
      type: "highlight",
    });
  });

  it("when same range is selected for annotation-less highlight, then toggles it off", () => {
    const opts = createOptions({
      selection: word1,
      layers: [
        {
          id: "layer-1",
          highlights: [
            {
              id: "h-existing",
              editorIndex: 0,
              from: 1,
              to: 5,
              text: "hello",
              annotation: "",
              type: "highlight" as const,
            },
          ],
        },
      ],
    });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-existing");
    expect(opts.addHighlight).not.toHaveBeenCalled();
  });

  it("when same range is selected for annotated highlight, then does NOT toggle it off", () => {
    const opts = createOptions({
      selection: word1,
      layers: [
        {
          id: "layer-1",
          highlights: [
            {
              id: "h-annotated",
              editorIndex: 0,
              from: 1,
              to: 5,
              text: "hello",
              annotation: "some note",
              type: "comment" as const,
            },
          ],
        },
      ],
    });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(opts.removeHighlight).not.toHaveBeenCalled();
    expect(opts.addHighlight).toHaveBeenCalled();
  });

  it("when highlight is created, then always shows success status", () => {
    const flashStatus = vi.fn();
    const opts = createOptions({ selection: word1, flashStatus });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(opts.addHighlight).toHaveBeenCalled();
    expect(flashStatus).toHaveBeenCalledWith({ text: "Highlight added.", type: "success" }, 3000);
  });

  it("when toggling off highlight, then shows removed status", () => {
    const flashStatus = vi.fn();
    const opts = createOptions({
      selection: word1,
      flashStatus,
      layers: [
        {
          id: "layer-1",
          highlights: [
            {
              id: "h-existing",
              editorIndex: 0,
              from: 1,
              to: 5,
              text: "hello",
              annotation: "",
              type: "highlight" as const,
            },
          ],
        },
      ],
    });
    const { result } = renderHook(() => useHighlightMode(opts));

    act(() => {
      result.current.confirmHighlight();
    });

    expect(flashStatus).toHaveBeenCalledWith({ text: "Highlight removed.", type: "success" }, 3000);
  });
});
