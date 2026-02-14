import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useHighlightMode } from "./use-highlight-mode"
import type { WordSelection, ActiveTool } from "@/types/editor"

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "highlight" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addLayer: vi.fn(() => "auto-layer-1"),
    layers: [] as { id: string; highlights: { id: string; editorIndex: number; from: number; to: number; annotation: string; type: "highlight" | "comment" }[] }[],
    addHighlight: vi.fn().mockReturnValue("h-1"),
    removeHighlight: vi.fn(),
    showHighlightToasts: true,
    setStatus: vi.fn(),
    clearStatus: vi.fn(),
    ...overrides,
  }
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" }

describe("useHighlightMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows entry status when highlight tool is activated", () => {
    const setStatus = vi.fn()
    renderHook(() => useHighlightMode(createOptions({ setStatus })))

    expect(setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ type: "info" })
    )
  })

  it("clears status when exiting highlight tool", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useHighlightMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "highlight" as ActiveTool } }
    )

    rerender({ activeTool: "selection" })
    expect(clearStatus).toHaveBeenCalled()
  })

  it("does not clear status when switching to another annotation tool", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useHighlightMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "highlight" as ActiveTool } }
    )

    rerender({ activeTool: "arrow" })
    expect(clearStatus).not.toHaveBeenCalled()
  })

  it("clears status when unlocking while highlight tool is active", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useHighlightMode(createOptions({ isLocked: props.isLocked, clearStatus })),
      { initialProps: { isLocked: true } }
    )

    rerender({ isLocked: false })
    expect(clearStatus).toHaveBeenCalled()
  })

  it("does nothing when activeTool is not highlight", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("does nothing when isLocked is false", () => {
    const opts = createOptions({ isLocked: false, selection: word1 })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("does nothing when there is no selection", () => {
    const opts = createOptions({ selection: null })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("auto-creates a layer when no active layer", () => {
    const addLayer = vi.fn(() => "auto-layer-1")
    const addHighlight = vi.fn().mockReturnValue("h-1")
    const opts = createOptions({ activeLayerId: null, addLayer, addHighlight, selection: word1 })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(addLayer).toHaveBeenCalled()
    expect(addHighlight).toHaveBeenCalledWith("auto-layer-1", {
      editorIndex: 0, from: 1, to: 5, text: "hello", annotation: "", type: "highlight",
    })
  })

  it("does nothing when addLayer fails (all colors used)", () => {
    const addLayer = vi.fn(() => "")
    const opts = createOptions({ activeLayerId: null, addLayer, selection: word1 })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(addLayer).toHaveBeenCalled()
    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("creates highlight with empty annotation", () => {
    const opts = createOptions({ selection: word1 })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(opts.addHighlight).toHaveBeenCalledWith("layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
      annotation: "",
      type: "highlight",
    })
  })

  it("toggles off existing annotation-less highlight when same range selected", () => {
    const opts = createOptions({
      selection: word1,
      layers: [{
        id: "layer-1",
        highlights: [
          { id: "h-existing", editorIndex: 0, from: 1, to: 5, annotation: "", type: "highlight" as const },
        ],
      }],
    })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-existing")
    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("does NOT toggle off annotated highlight at same range", () => {
    const opts = createOptions({
      selection: word1,
      layers: [{
        id: "layer-1",
        highlights: [
          { id: "h-annotated", editorIndex: 0, from: 1, to: 5, annotation: "some note", type: "comment" as const },
        ],
      }],
    })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(opts.removeHighlight).not.toHaveBeenCalled()
    expect(opts.addHighlight).toHaveBeenCalled()
  })

  it("shows success status when highlight is created and showHighlightToasts is true", () => {
    const setStatus = vi.fn()
    const opts = createOptions({ selection: word1, showHighlightToasts: true, setStatus })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(opts.addHighlight).toHaveBeenCalled()
    expect(setStatus).toHaveBeenCalledWith(
      { text: "Highlight added", type: "success" }, 1500
    )
  })

  it("does not show success status when showHighlightToasts is false", () => {
    const setStatus = vi.fn()
    const opts = createOptions({ selection: word1, showHighlightToasts: false, setStatus })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(opts.addHighlight).toHaveBeenCalled()
    const successCalls = setStatus.mock.calls.filter(
      (c: unknown[]) => (c[0] as { type: string })?.type === "success"
    )
    expect(successCalls).toHaveLength(0)
  })

  it("suppresses entry status when showHighlightToasts is false", () => {
    const setStatus = vi.fn()
    renderHook(() => useHighlightMode(createOptions({ showHighlightToasts: false, setStatus })))

    expect(setStatus).not.toHaveBeenCalled()
  })

  it("shows removed status when toggling off highlight", () => {
    const setStatus = vi.fn()
    const opts = createOptions({
      selection: word1,
      showHighlightToasts: true,
      setStatus,
      layers: [{
        id: "layer-1",
        highlights: [
          { id: "h-existing", editorIndex: 0, from: 1, to: 5, annotation: "", type: "highlight" as const },
        ],
      }],
    })
    const { result } = renderHook(() => useHighlightMode(opts))

    act(() => { result.current.confirmHighlight() })

    expect(setStatus).toHaveBeenCalledWith(
      { text: "Highlight removed", type: "success" }, 1500
    )
  })
})
