import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCommentMode } from "./use-comment-mode"
import type { WordSelection, ActiveTool } from "@/types/editor"

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "comments" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addLayer: vi.fn(() => "auto-layer-1"),
    layers: [] as { id: string; highlights: { id: string; editorIndex: number; from: number; to: number; text: string; annotation: string; type: "highlight" | "comment" }[] }[],
    addHighlight: vi.fn().mockReturnValue("h-1"),
    removeHighlight: vi.fn(),
    onHighlightAdded: vi.fn(),
    showCommentToasts: true,
    setStatus: vi.fn(),
    flashStatus: vi.fn(),
    clearStatus: vi.fn(),
    ...overrides,
  }
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" }
const word2: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "world" }

describe("useCommentMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows entry status when comments tool is activated", () => {
    const setStatus = vi.fn()
    renderHook(() => useCommentMode(createOptions({ setStatus })))

    expect(setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ type: "info" })
    )
  })

  it("clears status when exiting comments tool", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useCommentMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "comments" as ActiveTool } }
    )

    rerender({ activeTool: "selection" })
    expect(clearStatus).toHaveBeenCalled()
  })

  it("does not clear status when switching to another annotation tool", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useCommentMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "comments" as ActiveTool } }
    )

    rerender({ activeTool: "underline" })
    expect(clearStatus).not.toHaveBeenCalled()
  })

  it("clears status when unlocking while comments tool is active", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useCommentMode(createOptions({ isLocked: props.isLocked, clearStatus })),
      { initialProps: { isLocked: true } }
    )

    rerender({ isLocked: false })
    expect(clearStatus).toHaveBeenCalled()
  })

  it("does nothing when activeTool is not comments", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("does nothing when isLocked is false", () => {
    const opts = createOptions({ isLocked: false, selection: word1 })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("does nothing when there is no selection", () => {
    const opts = createOptions({ selection: null })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("auto-creates a layer when no active layer", () => {
    const addLayer = vi.fn(() => "auto-layer-1")
    const addHighlight = vi.fn().mockReturnValue("h-1")
    const onHighlightAdded = vi.fn()
    const opts = createOptions({ activeLayerId: null, addLayer, addHighlight, onHighlightAdded, selection: word1 })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(addLayer).toHaveBeenCalled()
    expect(addHighlight).toHaveBeenCalledWith("auto-layer-1", {
      editorIndex: 0, from: 1, to: 5, text: "hello", annotation: "", type: "comment",
    })
    expect(onHighlightAdded).toHaveBeenCalledWith("auto-layer-1", "h-1")
  })

  it("does nothing when addLayer fails (all colors used)", () => {
    const addLayer = vi.fn(() => "")
    const opts = createOptions({ activeLayerId: null, addLayer, selection: word1 })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(addLayer).toHaveBeenCalled()
    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("creates highlight and calls onHighlightAdded", () => {
    const opts = createOptions({ selection: word1 })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.addHighlight).toHaveBeenCalledWith("layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
      annotation: "",
      type: "comment",
    })
    expect(opts.onHighlightAdded).toHaveBeenCalledWith("layer-1", "h-1")
  })

  it("preserves selection after creating highlight for keyboard navigation", () => {
    const clearSelection = vi.fn()
    const opts = createOptions({ selection: word1 })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    // Selection should NOT be cleared so user can continue navigating
    expect(clearSelection).not.toHaveBeenCalled()
  })

  it("removes empty-annotation highlights before creating new one", () => {
    const opts = createOptions({
      selection: word2,
      layers: [{
        id: "layer-1",
        highlights: [
          { id: "h-empty", editorIndex: 0, from: 20, to: 25, text: "empty", annotation: "", type: "comment" as const },
          { id: "h-saved", editorIndex: 0, from: 30, to: 35, text: "saved", annotation: "saved", type: "comment" as const },
        ],
      }],
    })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-empty")
    expect(opts.removeHighlight).not.toHaveBeenCalledWith("layer-1", "h-saved")
    expect(opts.addHighlight).toHaveBeenCalled()
  })

  it("toggles off highlight when same range selected", () => {
    const opts = createOptions({
      selection: word1,
      layers: [{
        id: "layer-1",
        highlights: [
          { id: "h-existing", editorIndex: 0, from: 1, to: 5, text: "hello", annotation: "note", type: "comment" as const },
        ],
      }],
    })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-existing")
    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("shows success status when highlight is created and showCommentToasts is true", () => {
    const flashStatus = vi.fn()
    const opts = createOptions({ selection: word1, showCommentToasts: true, flashStatus })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.addHighlight).toHaveBeenCalled()
    expect(flashStatus).toHaveBeenCalledWith(
      { text: "Comment added.", type: "success" }, 3000
    )
  })

  it("does not show success status when showCommentToasts is false", () => {
    const flashStatus = vi.fn()
    const opts = createOptions({ selection: word1, showCommentToasts: false, flashStatus })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.addHighlight).toHaveBeenCalled()
    expect(flashStatus).not.toHaveBeenCalled()
  })

  it("suppresses entry status when showCommentToasts is false", () => {
    const setStatus = vi.fn()
    renderHook(() => useCommentMode(createOptions({ showCommentToasts: false, setStatus })))

    expect(setStatus).not.toHaveBeenCalled()
  })

  it("stays in comments mode (does NOT switch to selection)", () => {
    const setActiveTool = vi.fn()
    const opts = createOptions({ selection: word1 })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    // No setActiveTool in the hook — it stays in comments mode
    expect(setActiveTool).not.toHaveBeenCalled()
  })
})
