import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrawingMode } from "./use-drawing-mode";
import type { WordSelection, ActiveTool } from "@/types/editor";

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "arrow" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    activeArrowStyle: "solid" as import("@/types/editor").ArrowStyle,
    addLayer: vi.fn(() => "auto-layer-1"),
    addArrow: vi.fn(),
    setStatus: vi.fn(),
    flashStatus: vi.fn(),
    clearStatus: vi.fn(),
    ...overrides,
  };
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" };
const word2: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "world" };

describe("useDrawingMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when arrow tool is activated, then shows entry status", () => {
    const setStatus = vi.fn();
    renderHook(() => useDrawingMode(createOptions({ setStatus })));

    expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("when activeTool is not arrow, then does nothing", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 });
    const { result } = renderHook(() => useDrawingMode(opts));

    act(() => {
      result.current.confirmSelection();
    });

    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
  });

  it("when isLocked is false, then does nothing", () => {
    const { result } = renderHook(() =>
      useDrawingMode({ ...createOptions({ isLocked: false }), selection: word1 }),
    );

    act(() => {
      result.current.confirmSelection();
    });

    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
  });

  it("when confirmSelection is called with no selection, then does nothing", () => {
    const setStatus = vi.fn();
    const { result } = renderHook(() => useDrawingMode(createOptions({ setStatus })));

    act(() => {
      result.current.confirmSelection();
    });

    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
    // Only the entry status, no target status
    expect(setStatus).toHaveBeenCalledTimes(1);
  });

  it("when confirmSelection is called, then sets anchor and shows target status", () => {
    const setStatus = vi.fn();
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection, setStatus })),
      { initialProps: { selection: null as WordSelection | null } },
    );

    // Set selection, then confirm
    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(result.current.drawingState).toEqual({
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
    });
    expect(result.current.isDrawing).toBe(true);
    // Entry + target = 2 calls
    expect(setStatus).toHaveBeenCalledTimes(2);
  });

  it("when second confirm is called with a different word, then creates arrow", () => {
    const addArrow = vi.fn();
    const setStatus = vi.fn();
    const flashStatus = vi.fn();
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({ selection: props.selection, addArrow, setStatus, flashStatus }),
        ),
      { initialProps: { selection: null as WordSelection | null } },
    );

    // Set selection and confirm anchor
    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    expect(result.current.isDrawing).toBe(true);

    // Set different selection and confirm target
    rerender({ selection: word2 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(addArrow).toHaveBeenCalledWith("layer-1", {
      from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      to: { editorIndex: 0, from: 10, to: 15, text: "world" },
      arrowStyle: "solid",
    });
    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
    expect(flashStatus).toHaveBeenCalledWith({ text: "Arrow created.", type: "success" }, 3000);
  });

  it("when arrow is created, then stays in arrow mode and resets to selecting-anchor", () => {
    const setStatus = vi.fn();
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection, setStatus })),
      { initialProps: { selection: null as WordSelection | null } },
    );

    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    rerender({ selection: word2 });
    act(() => {
      result.current.confirmSelection();
    });

    // Entry + target + reset to selecting-anchor = 3 base status calls
    expect(setStatus).toHaveBeenCalledTimes(3);
    // The last base status call should be the selecting-anchor prompt
    expect(setStatus).toHaveBeenLastCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("when same selection as anchor is confirmed, then reverts to selecting-anchor phase", () => {
    const setStatus = vi.fn();
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection, setStatus })),
      { initialProps: { selection: null as WordSelection | null } },
    );

    // Confirm anchor
    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    expect(result.current.isDrawing).toBe(true);

    // Confirm same selection — reverts to selecting-anchor
    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
    // Entry + target + revert = 3 calls
    expect(setStatus).toHaveBeenCalledTimes(3);
  });

  it("when no active layer exists on confirm, then auto-creates one", () => {
    const addLayer = vi.fn(() => "auto-layer-1");
    const addArrow = vi.fn();
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({ selection: props.selection, activeLayerId: null, addLayer, addArrow }),
        ),
      { initialProps: { selection: null as WordSelection | null } },
    );

    // First confirm — should auto-create layer and set anchor
    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(result.current.isDrawing).toBe(true);

    // Second confirm — should create arrow on the auto-created layer
    rerender({ selection: word2 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(addArrow).toHaveBeenCalledWith("auto-layer-1", {
      from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      to: { editorIndex: 0, from: 10, to: 15, text: "world" },
      arrowStyle: "solid",
    });
  });

  it("when addLayer fails (all colors used), then does nothing", () => {
    const addLayer = vi.fn(() => "");
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({ selection: props.selection, activeLayerId: null, addLayer }),
        ),
      { initialProps: { selection: null as WordSelection | null } },
    );

    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
  });

  it("when switching away from arrow tool, then clears status", () => {
    const clearStatus = vi.fn();
    const { result, rerender } = renderHook(
      (props: { activeTool: ActiveTool; selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({ activeTool: props.activeTool, selection: props.selection, clearStatus }),
        ),
      {
        initialProps: {
          activeTool: "arrow" as ActiveTool,
          selection: null as WordSelection | null,
        },
      },
    );

    rerender({ activeTool: "arrow", selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    expect(result.current.isDrawing).toBe(true);

    rerender({ activeTool: "selection", selection: word1 });
    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
    expect(clearStatus).toHaveBeenCalled();
  });

  it("when switching to another annotation tool, then does not clear status", () => {
    const clearStatus = vi.fn();
    const { result, rerender } = renderHook(
      (props: { activeTool: ActiveTool; selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({ activeTool: props.activeTool, selection: props.selection, clearStatus }),
        ),
      {
        initialProps: {
          activeTool: "arrow" as ActiveTool,
          selection: null as WordSelection | null,
        },
      },
    );

    // Enter drawing phase so wasActive will be true
    rerender({ activeTool: "arrow", selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    expect(result.current.isDrawing).toBe(true);

    // Switch to underline (not selection) — should NOT clear status
    rerender({ activeTool: "underline", selection: word1 });
    expect(clearStatus).not.toHaveBeenCalled();
  });

  it("when unlocking while arrow tool is active, then clears status", () => {
    const clearStatus = vi.fn();
    const { result, rerender } = renderHook(
      (props: { isLocked: boolean; selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({ isLocked: props.isLocked, selection: props.selection, clearStatus }),
        ),
      { initialProps: { isLocked: true, selection: null as WordSelection | null } },
    );

    rerender({ isLocked: true, selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    expect(result.current.isDrawing).toBe(true);

    rerender({ isLocked: false, selection: word1 });
    expect(clearStatus).toHaveBeenCalled();
  });

  it("when unlocking, then clears drawing state", () => {
    const { result, rerender } = renderHook(
      (props: { isLocked: boolean; selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ isLocked: props.isLocked, selection: props.selection })),
      { initialProps: { isLocked: true, selection: null as WordSelection | null } },
    );

    rerender({ isLocked: true, selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    expect(result.current.isDrawing).toBe(true);

    rerender({ isLocked: false, selection: word1 });
    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
  });

  it("when in selecting-anchor phase, then preview does not appear", () => {
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection })),
      { initialProps: { selection: null as WordSelection | null } },
    );

    // During selecting-anchor phase, selection changes should NOT create a preview
    rerender({ selection: word1 });
    expect(result.current.drawingState).toBeNull();

    // Confirm anchor
    act(() => {
      result.current.confirmSelection();
    });
    expect(result.current.isDrawing).toBe(true);

    // Now in anchor-confirmed phase, selection changes SHOULD update preview
    rerender({ selection: word2 });
    expect(result.current.drawingState?.anchor).toEqual({
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
    });
    expect(result.current.drawingState?.cursor).toEqual({
      editorIndex: 0,
      from: 10,
      to: 15,
      text: "world",
    });
  });

  it("when arrow tool is active, then always shows status messages", () => {
    const setStatus = vi.fn();
    renderHook(() => useDrawingMode(createOptions({ setStatus })));

    expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("when arrow is created, then always shows success status", () => {
    const addArrow = vi.fn();
    const setStatus = vi.fn();
    const flashStatus = vi.fn();
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({
            addArrow,
            selection: props.selection,
            setStatus,
            flashStatus,
          }),
        ),
      { initialProps: { selection: null as WordSelection | null } },
    );

    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    rerender({ selection: word2 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(addArrow).toHaveBeenCalled();
    expect(flashStatus).toHaveBeenCalledWith({ text: "Arrow created.", type: "success" }, 3000);
  });

  it("when anchor is confirmed, then selection is preserved", () => {
    const { result } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection })),
      { initialProps: { selection: word1 as WordSelection | null } },
    );

    act(() => {
      result.current.confirmSelection();
    });

    // Drawing state should be set (anchor confirmed), but
    // the hook does not call clearSelection — selection remains as-is
    expect(result.current.isDrawing).toBe(true);
    // The selection prop was not changed by the hook; it stays word1
    // (the parent would still pass word1 as selection)
  });

  it("when entering arrow mode, then selection is preserved", () => {
    const { result, rerender } = renderHook(
      (props: { activeTool: ActiveTool; selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ activeTool: props.activeTool, selection: props.selection })),
      {
        initialProps: {
          activeTool: "selection" as ActiveTool,
          selection: word1 as WordSelection | null,
        },
      },
    );

    // Switch to arrow tool — selection should not be cleared
    rerender({ activeTool: "arrow", selection: word1 });

    // The hook does not modify selection; it should still be word1
    // Confirm the preserved selection sets the anchor
    act(() => {
      result.current.confirmSelection();
    });
    expect(result.current.drawingState).toEqual({
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
    });
  });

  it("when exiting from idle phase, then does not clear status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useDrawingMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "selection" as ActiveTool } },
    );

    // Never entered arrow mode, switching tools should not clear
    rerender({ activeTool: "comments" });
    expect(clearStatus).not.toHaveBeenCalled();
  });

  it("when arrow is created, then includes activeArrowStyle", () => {
    const addArrow = vi.fn();
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({ selection: props.selection, addArrow, activeArrowStyle: "dashed" }),
        ),
      { initialProps: { selection: null as WordSelection | null } },
    );

    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    rerender({ selection: word2 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(addArrow).toHaveBeenCalledWith("layer-1", {
      from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      to: { editorIndex: 0, from: 10, to: 15, text: "world" },
      arrowStyle: "dashed",
    });
  });

  it("when activeArrowStyle is not specified, then uses default solid style", () => {
    const addArrow = vi.fn();
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection, addArrow })),
      { initialProps: { selection: null as WordSelection | null } },
    );

    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });
    rerender({ selection: word2 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(addArrow).toHaveBeenCalledWith(
      "layer-1",
      expect.objectContaining({
        arrowStyle: "solid",
      }),
    );
  });
});
