import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { toast } from "sonner"
import { useDrawingMode } from "./use-drawing-mode"
import type { WordSelection, ActiveTool } from "@/types/editor"

vi.mock("sonner", () => ({
  toast: { warning: vi.fn(), info: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
}))

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "arrow" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addArrow: vi.fn(),
    showDrawingToasts: true,
    setActiveTool: vi.fn(),
    ...overrides,
  }
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" }
const word2: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "world" }

describe("useDrawingMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows entry toast when arrow tool is activated", () => {
    renderHook(() => useDrawingMode(createOptions()))

    expect(toast.info).toHaveBeenCalledWith(expect.anything(), { id: "arrow-drawing" })
  })

  it("does nothing when activeTool is not arrow", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 })
    const { result } = renderHook(() => useDrawingMode(opts))

    act(() => { result.current.confirmSelection() })

    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("does nothing when isLocked is false", () => {
    const { result } = renderHook(() =>
      useDrawingMode({ ...createOptions({ isLocked: false }), selection: word1 })
    )

    act(() => { result.current.confirmSelection() })

    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("confirmSelection with no selection does nothing", () => {
    const { result } = renderHook(() => useDrawingMode(createOptions()))

    act(() => { result.current.confirmSelection() })

    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
    // Only the entry toast, no target toast
    expect(toast.info).toHaveBeenCalledTimes(1)
  })

  it("sets anchor on confirmSelection and shows target toast", () => {
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection })),
      { initialProps: { selection: null } }
    )

    // Set selection, then confirm
    rerender({ selection: word1 })
    act(() => { result.current.confirmSelection() })

    expect(result.current.drawingState).toEqual({
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
    })
    expect(result.current.isDrawing).toBe(true)
    expect(toast.info).toHaveBeenCalledWith(expect.anything(), { id: "arrow-drawing" })
  })

  it("creates arrow on second confirm with different word", () => {
    const addArrow = vi.fn()
    const setActiveTool = vi.fn()
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection, addArrow, setActiveTool })),
      { initialProps: { selection: null } }
    )

    // Set selection and confirm anchor
    rerender({ selection: word1 })
    act(() => { result.current.confirmSelection() })
    expect(result.current.isDrawing).toBe(true)

    // Set different selection and confirm target
    rerender({ selection: word2 })
    act(() => { result.current.confirmSelection() })

    expect(addArrow).toHaveBeenCalledWith("layer-1", {
      from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      to: { editorIndex: 0, from: 10, to: 15, text: "world" },
    })
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
    expect(toast.success).toHaveBeenCalledWith("Arrow created", { id: "arrow-drawing", duration: 1500 })
  })

  it("calls setActiveTool('selection') after arrow created", () => {
    const setActiveTool = vi.fn()
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection, setActiveTool })),
      { initialProps: { selection: null } }
    )

    rerender({ selection: word1 })
    act(() => { result.current.confirmSelection() })
    rerender({ selection: word2 })
    act(() => { result.current.confirmSelection() })

    expect(setActiveTool).toHaveBeenCalledWith("selection")
  })

  it("same selection as anchor reverts to selecting-anchor phase", () => {
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection })),
      { initialProps: { selection: null } }
    )

    // Confirm anchor
    rerender({ selection: word1 })
    act(() => { result.current.confirmSelection() })
    expect(result.current.isDrawing).toBe(true)

    // Confirm same selection — reverts to selecting-anchor
    rerender({ selection: word1 })
    act(() => { result.current.confirmSelection() })

    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
    // Should show the anchor instruction toast again
    expect(toast.info).toHaveBeenCalledWith(expect.anything(), { id: "arrow-drawing" })
  })

  it("shows error toast when no active layer on confirm", () => {
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection, activeLayerId: null })),
      { initialProps: { selection: null } }
    )

    rerender({ selection: word1 })
    act(() => { result.current.confirmSelection() })

    expect(toast.warning).toHaveBeenCalledWith("Add a new layer before drawing arrows")
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("clears drawing state when switching away from arrow tool", () => {
    const { result, rerender } = renderHook(
      (props: { activeTool: ActiveTool; selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ activeTool: props.activeTool, selection: props.selection })),
      { initialProps: { activeTool: "arrow" as ActiveTool, selection: null } }
    )

    rerender({ activeTool: "arrow", selection: word1 })
    act(() => { result.current.confirmSelection() })
    expect(result.current.isDrawing).toBe(true)

    rerender({ activeTool: "selection", selection: word1 })
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
    expect(toast.dismiss).toHaveBeenCalledWith("arrow-drawing")
  })

  it("clears drawing state on unlock", () => {
    const { result, rerender } = renderHook(
      (props: { isLocked: boolean; selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ isLocked: props.isLocked, selection: props.selection })),
      { initialProps: { isLocked: true, selection: null } }
    )

    rerender({ isLocked: true, selection: word1 })
    act(() => { result.current.confirmSelection() })
    expect(result.current.isDrawing).toBe(true)

    rerender({ isLocked: false, selection: word1 })
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("preview only appears after anchor-confirmed (not during selecting-anchor)", () => {
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection })),
      { initialProps: { selection: null } }
    )

    // During selecting-anchor phase, selection changes should NOT create a preview
    rerender({ selection: word1 })
    expect(result.current.drawingState).toBeNull()

    // Confirm anchor
    act(() => { result.current.confirmSelection() })
    expect(result.current.isDrawing).toBe(true)

    // Now in anchor-confirmed phase, selection changes SHOULD update preview
    rerender({ selection: word2 })
    expect(result.current.drawingState?.anchor).toEqual({
      editorIndex: 0, from: 1, to: 5, text: "hello",
    })
    expect(result.current.drawingState?.cursor).toEqual({
      editorIndex: 0, from: 10, to: 15, text: "world",
    })
  })

  it("suppresses info toast when showDrawingToasts is false", () => {
    renderHook(() => useDrawingMode(createOptions({ showDrawingToasts: false })))

    expect(toast.info).not.toHaveBeenCalled()
  })

  it("suppresses success toast when showDrawingToasts is false", () => {
    const addArrow = vi.fn()
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ showDrawingToasts: false, addArrow, selection: props.selection })),
      { initialProps: { selection: null } }
    )

    rerender({ selection: word1 })
    act(() => { result.current.confirmSelection() })
    rerender({ selection: word2 })
    act(() => { result.current.confirmSelection() })

    expect(addArrow).toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("still shows warning toast when showDrawingToasts is false", () => {
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ showDrawingToasts: false, activeLayerId: null, selection: props.selection })),
      { initialProps: { selection: null } }
    )

    rerender({ selection: word1 })
    act(() => { result.current.confirmSelection() })

    expect(toast.warning).toHaveBeenCalledWith("Add a new layer before drawing arrows")
  })

  it("selection is preserved after confirming anchor", () => {
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ selection: props.selection })),
      { initialProps: { selection: word1 } }
    )

    act(() => { result.current.confirmSelection() })

    // Drawing state should be set (anchor confirmed), but
    // the hook does not call clearSelection — selection remains as-is
    expect(result.current.isDrawing).toBe(true)
    // The selection prop was not changed by the hook; it stays word1
    // (the parent would still pass word1 as selection)
  })

  it("selection is preserved after entering arrow mode", () => {
    const { result, rerender } = renderHook(
      (props: { activeTool: ActiveTool; selection: WordSelection | null }) =>
        useDrawingMode(createOptions({ activeTool: props.activeTool, selection: props.selection })),
      { initialProps: { activeTool: "selection" as ActiveTool, selection: word1 } }
    )

    // Switch to arrow tool — selection should not be cleared
    rerender({ activeTool: "arrow", selection: word1 })

    // The hook does not modify selection; it should still be word1
    // Confirm the preserved selection sets the anchor
    act(() => { result.current.confirmSelection() })
    expect(result.current.drawingState).toEqual({
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
    })
  })

  it("does not dismiss toast when exiting from idle phase", () => {
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useDrawingMode(createOptions({ activeTool: props.activeTool, showDrawingToasts: false })),
      { initialProps: { activeTool: "selection" as ActiveTool } }
    )

    // Never entered arrow mode, switching tools should not dismiss
    rerender({ activeTool: "comments" })
    expect(toast.dismiss).not.toHaveBeenCalled()
  })
})
