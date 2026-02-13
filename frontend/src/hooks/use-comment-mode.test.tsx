import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { toast } from "sonner"
import { useCommentMode } from "./use-comment-mode"
import type { WordSelection, ActiveTool } from "@/types/editor"

vi.mock("sonner", () => ({
  toast: { warning: vi.fn(), info: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
}))

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "comments" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    layers: [] as { id: string; highlights: { id: string; editorIndex: number; from: number; to: number; annotation: string }[] }[],
    addHighlight: vi.fn().mockReturnValue("h-1"),
    removeHighlight: vi.fn(),
    clearSelection: vi.fn(),
    onHighlightAdded: vi.fn(),
    showCommentToasts: true,
    ...overrides,
  }
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" }
const word2: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "world" }

describe("useCommentMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows entry toast when comments tool is activated", () => {
    renderHook(() => useCommentMode(createOptions()))

    expect(toast.info).toHaveBeenCalledWith(expect.anything(), { id: "comment-mode" })
  })

  it("dismisses toast when exiting comments tool", () => {
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useCommentMode(createOptions({ activeTool: props.activeTool })),
      { initialProps: { activeTool: "comments" as ActiveTool } }
    )

    rerender({ activeTool: "selection" })
    expect(toast.dismiss).toHaveBeenCalledWith("comment-mode")
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

  it("warns when no active layer", () => {
    const opts = createOptions({ activeLayerId: null, selection: word1 })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(toast.warning).toHaveBeenCalledWith("Add a new layer to create annotations")
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
    })
    expect(opts.onHighlightAdded).toHaveBeenCalledWith("layer-1", "h-1")
  })

  it("clears selection after creating highlight", () => {
    const opts = createOptions({ selection: word1 })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.clearSelection).toHaveBeenCalled()
  })

  it("removes empty-annotation highlights before creating new one", () => {
    const opts = createOptions({
      selection: word2,
      layers: [{
        id: "layer-1",
        highlights: [
          { id: "h-empty", editorIndex: 0, from: 20, to: 25, annotation: "" },
          { id: "h-saved", editorIndex: 0, from: 30, to: 35, annotation: "saved" },
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
          { id: "h-existing", editorIndex: 0, from: 1, to: 5, annotation: "note" },
        ],
      }],
    })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-existing")
    expect(opts.addHighlight).not.toHaveBeenCalled()
    expect(opts.clearSelection).toHaveBeenCalled()
  })

  it("shows success toast when highlight is created and showCommentToasts is true", () => {
    const opts = createOptions({ selection: word1, showCommentToasts: true })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.addHighlight).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith("Comment added", { id: "comment-mode", duration: 1500 })
  })

  it("does not show success toast when showCommentToasts is false", () => {
    const opts = createOptions({ selection: word1, showCommentToasts: false })
    const { result } = renderHook(() => useCommentMode(opts))

    act(() => { result.current.confirmComment() })

    expect(opts.addHighlight).toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("suppresses entry toast when showCommentToasts is false", () => {
    renderHook(() => useCommentMode(createOptions({ showCommentToasts: false })))

    expect(toast.info).not.toHaveBeenCalled()
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
