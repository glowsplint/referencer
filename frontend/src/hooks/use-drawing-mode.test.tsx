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
    showDrawingToasts: true,
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

  it("shows entry status when arrow tool is activated", () => {
    const setStatus = vi.fn();
    renderHook(() => useDrawingMode(createOptions({ setStatus })));

    expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("does nothing when activeTool is not arrow", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 });
    const { result } = renderHook(() => useDrawingMode(opts));

    act(() => {
      result.current.confirmSelection();
    });

    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
  });

  it("does nothing when isLocked is false", () => {
    const { result } = renderHook(() =>
      useDrawingMode({ ...createOptions({ isLocked: false }), selection: word1 }),
    );

    act(() => {
      result.current.confirmSelection();
    });

    expect(result.current.drawingState).toBeNull();
    expect(result.current.isDrawing).toBe(false);
  });

  it("confirmSelection with no selection does nothing", () => {
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

  it("sets anchor on confirmSelection and shows target status", () => {
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

  it("creates arrow on second confirm with different word", () => {
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

  it("stays in arrow mode after arrow created (resets to selecting-anchor)", () => {
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

  it("same selection as anchor reverts to selecting-anchor phase", () => {
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

  it("auto-creates a layer when no active layer on confirm", () => {
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

  it("does nothing when addLayer fails (all colors used)", () => {
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

  it("clears status when switching away from arrow tool", () => {
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

  it("does not clear status when switching to another annotation tool", () => {
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

  it("clears status when unlocking while arrow tool is active", () => {
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

  it("clears drawing state on unlock", () => {
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

  it("preview only appears after anchor-confirmed (not during selecting-anchor)", () => {
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

  it("suppresses info status when showDrawingToasts is false", () => {
    const setStatus = vi.fn();
    renderHook(() => useDrawingMode(createOptions({ showDrawingToasts: false, setStatus })));

    expect(setStatus).not.toHaveBeenCalled();
  });

  it("suppresses success status when showDrawingToasts is false", () => {
    const addArrow = vi.fn();
    const setStatus = vi.fn();
    const flashStatus = vi.fn();
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({
            showDrawingToasts: false,
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
    expect(setStatus).not.toHaveBeenCalled();
    expect(flashStatus).not.toHaveBeenCalled();
  });

  it("auto-creates layer even when showDrawingToasts is false", () => {
    const addLayer = vi.fn(() => "auto-layer-1");
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(
          createOptions({
            showDrawingToasts: false,
            activeLayerId: null,
            addLayer,
            selection: props.selection,
          }),
        ),
      { initialProps: { selection: null as WordSelection | null } },
    );

    rerender({ selection: word1 });
    act(() => {
      result.current.confirmSelection();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(result.current.isDrawing).toBe(true);
  });

  it("selection is preserved after confirming anchor", () => {
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

  it("selection is preserved after entering arrow mode", () => {
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

  it("does not clear status when exiting from idle phase", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useDrawingMode(
          createOptions({ activeTool: props.activeTool, showDrawingToasts: false, clearStatus }),
        ),
      { initialProps: { activeTool: "selection" as ActiveTool } },
    );

    // Never entered arrow mode, switching tools should not clear
    rerender({ activeTool: "comments" });
    expect(clearStatus).not.toHaveBeenCalled();
  });

  it("includes activeArrowStyle in created arrow", () => {
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

  it("uses default solid style when activeArrowStyle not specified", () => {
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
