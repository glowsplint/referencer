import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDragSelection } from "./use-drag-selection"
import type { Editor } from "@tiptap/react"
import type { ActiveTool } from "@/types/editor"

vi.mock("@/lib/tiptap/word-boundaries", () => ({
  getWordBoundaries: (_doc: unknown, pos: number) => {
    if (pos === 5) return { from: 1, to: 5, text: "hello" }
    if (pos === 12) return { from: 10, to: 15, text: "world" }
    return null
  },
}))

function createMockEditor(posResult: { pos: number } | null = { pos: 5 }) {
  return {
    view: {
      posAtCoords: vi.fn().mockReturnValue(posResult),
    },
    state: {
      doc: {
        textBetween: vi.fn().mockReturnValue("hello"),
      },
    },
  } as unknown as Editor
}

function createMockEvent(tagName = "DIV", clientX = 100, clientY = 100) {
  return {
    target: { tagName },
    clientX,
    clientY,
  } as unknown as React.MouseEvent
}

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "comments" as ActiveTool,
    selectWord: vi.fn(),
    selectRange: vi.fn(),
    clearSelection: vi.fn(),
    ...overrides,
  }
}

describe("useDragSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls selectWord on mouseDown", () => {
    const opts = createOptions()
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })

    expect(opts.selectWord).toHaveBeenCalledWith(0, 1, 5, "hello")
  })

  it("calls selectWord on mouseUp", () => {
    const opts = createOptions()
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor, 0)
    })

    expect(opts.selectWord).toHaveBeenCalledWith(0, 1, 5, "hello")
  })

  it("does not create highlights for any tool", () => {
    for (const tool of ["selection", "arrow", "comments"] as ActiveTool[]) {
      const opts = createOptions({ activeTool: tool })
      const { result } = renderHook(() => useDragSelection(opts))
      const editor = createMockEditor()

      act(() => {
        result.current.handleMouseDown(createMockEvent(), editor, 0)
      })
      act(() => {
        result.current.handleMouseUp(createMockEvent(), editor, 0)
      })

      // selectWord is called, but no highlight creation
      expect(opts.selectWord).toHaveBeenCalled()
    }
  })

  it("clears selection when clicking on empty space", () => {
    const opts = createOptions()
    const editor = createMockEditor(null)
    const { result } = renderHook(() => useDragSelection(opts))

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })

    expect(opts.clearSelection).toHaveBeenCalled()
  })

  it("does nothing when not locked", () => {
    const opts = createOptions({ isLocked: false })
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })

    expect(opts.selectWord).not.toHaveBeenCalled()
  })

  it("calls selectRange on mouseUp after multi-word drag", () => {
    const opts = createOptions()
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    // mouseDown on first word (pos=5 → from:1, to:5, text:"hello")
    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })

    // mouseMove to second word (pos=12 → from:10, to:15, text:"world")
    const editor2 = createMockEditor({ pos: 12 })
    ;(editor2.state.doc.textBetween as ReturnType<typeof vi.fn>).mockReturnValue("hello world")
    act(() => {
      result.current.handleMouseMove(createMockEvent("DIV", 200, 100), editor2, 0)
    })

    // mouseUp finalizes
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor2, 0)
    })

    expect(opts.selectRange).toHaveBeenCalledWith(
      { editorIndex: 0, from: 1, to: 5, text: "hello" },
      { editorIndex: 0, from: 10, to: 15, text: "world" },
      { editorIndex: 0, from: 1, to: 15, text: "hello world" }
    )
    // selectWord called for mouseDown + mouseMove preview, but NOT mouseUp
    expect(opts.selectWord).toHaveBeenCalledTimes(2)
  })

  it("calls selectWord (not selectRange) on single-click mouseUp", () => {
    const opts = createOptions()
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor, 0)
    })

    expect(opts.selectRange).not.toHaveBeenCalled()
    expect(opts.selectWord).toHaveBeenCalledWith(0, 1, 5, "hello")
  })

  it("does not interfere with textarea clicks", () => {
    const opts = createOptions()
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent("TEXTAREA"), editor, 0)
    })

    expect(opts.selectWord).not.toHaveBeenCalled()
  })
})
