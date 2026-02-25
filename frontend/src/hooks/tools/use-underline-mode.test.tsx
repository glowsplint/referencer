import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnderlineMode } from "./use-underline-mode";
import type { WordSelection, ActiveTool, LayerUnderline } from "@/types/editor";

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "underline" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addLayer: vi.fn(() => "auto-layer-1"),
    layers: [] as { id: string; underlines: LayerUnderline[] }[],
    addUnderline: vi.fn().mockReturnValue("u-1"),
    removeUnderline: vi.fn(),
    setStatus: vi.fn(),
    flashStatus: vi.fn(),
    clearStatus: vi.fn(),
    ...overrides,
  };
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" };

describe("useUnderlineMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when underline tool is activated, then shows entry status", () => {
    const setStatus = vi.fn();
    renderHook(() => useUnderlineMode(createOptions({ setStatus })));

    expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("when exiting underline tool to selection, then clears status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useUnderlineMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "underline" as ActiveTool } },
    );

    rerender({ activeTool: "selection" });
    expect(clearStatus).toHaveBeenCalled();
  });

  it("when switching to another annotation tool, then does not clear status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useUnderlineMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "underline" as ActiveTool } },
    );

    rerender({ activeTool: "arrow" });
    expect(clearStatus).not.toHaveBeenCalled();
  });

  it("when unlocking while underline tool is active, then clears status", () => {
    const clearStatus = vi.fn();
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useUnderlineMode(createOptions({ isLocked: props.isLocked, clearStatus })),
      { initialProps: { isLocked: true } },
    );

    rerender({ isLocked: false });
    expect(clearStatus).toHaveBeenCalled();
  });

  it("when underline tool is active, then always shows entry status", () => {
    const setStatus = vi.fn();
    renderHook(() => useUnderlineMode(createOptions({ setStatus })));

    expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("when activeTool is not underline, then does nothing", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 });
    const { result } = renderHook(() => useUnderlineMode(opts));

    act(() => {
      result.current.confirmUnderline();
    });

    expect(opts.addUnderline).not.toHaveBeenCalled();
  });

  it("when isLocked is false, then does nothing", () => {
    const opts = createOptions({ isLocked: false, selection: word1 });
    const { result } = renderHook(() => useUnderlineMode(opts));

    act(() => {
      result.current.confirmUnderline();
    });

    expect(opts.addUnderline).not.toHaveBeenCalled();
  });

  it("when there is no selection, then does nothing", () => {
    const opts = createOptions({ selection: null });
    const { result } = renderHook(() => useUnderlineMode(opts));

    act(() => {
      result.current.confirmUnderline();
    });

    expect(opts.addUnderline).not.toHaveBeenCalled();
  });

  it("when a selection is confirmed, then creates underline", () => {
    const opts = createOptions({ selection: word1 });
    const { result } = renderHook(() => useUnderlineMode(opts));

    act(() => {
      result.current.confirmUnderline();
    });

    expect(opts.addUnderline).toHaveBeenCalledWith("layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
    });
  });

  it("when underline is created, then shows success status", () => {
    const flashStatus = vi.fn();
    const opts = createOptions({ selection: word1, flashStatus });
    const { result } = renderHook(() => useUnderlineMode(opts));

    act(() => {
      result.current.confirmUnderline();
    });

    expect(flashStatus).toHaveBeenCalledWith({ text: "Underline added.", type: "success" }, 3000);
  });

  it("when underline is created, then always shows success status", () => {
    const flashStatus = vi.fn();
    const opts = createOptions({ selection: word1, flashStatus });
    const { result } = renderHook(() => useUnderlineMode(opts));

    act(() => {
      result.current.confirmUnderline();
    });

    expect(opts.addUnderline).toHaveBeenCalled();
    expect(flashStatus).toHaveBeenCalledWith({ text: "Underline added.", type: "success" }, 3000);
  });

  it("when no active layer exists, then auto-creates one", () => {
    const addLayer = vi.fn(() => "auto-layer-1");
    const addUnderline = vi.fn().mockReturnValue("u-1");
    const opts = createOptions({ activeLayerId: null, addLayer, addUnderline, selection: word1 });
    const { result } = renderHook(() => useUnderlineMode(opts));

    act(() => {
      result.current.confirmUnderline();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(addUnderline).toHaveBeenCalledWith("auto-layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
    });
  });

  it("when addLayer fails (all colors used), then does nothing", () => {
    const addLayer = vi.fn(() => "");
    const opts = createOptions({ activeLayerId: null, addLayer, selection: word1 });
    const { result } = renderHook(() => useUnderlineMode(opts));

    act(() => {
      result.current.confirmUnderline();
    });

    expect(addLayer).toHaveBeenCalled();
    expect(opts.addUnderline).not.toHaveBeenCalled();
  });

  it("when same range is selected for existing underline, then toggles it off", () => {
    const opts = createOptions({
      selection: word1,
      layers: [
        {
          id: "layer-1",
          underlines: [{ id: "u-existing", editorIndex: 0, from: 1, to: 5, text: "hello" }],
        },
      ],
    });
    const { result } = renderHook(() => useUnderlineMode(opts));

    act(() => {
      result.current.confirmUnderline();
    });

    expect(opts.removeUnderline).toHaveBeenCalledWith("layer-1", "u-existing");
    expect(opts.addUnderline).not.toHaveBeenCalled();
  });
});
