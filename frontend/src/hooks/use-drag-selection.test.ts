import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { toast } from "sonner"
import { useDragSelection } from "./use-drag-selection"
import type { Editor } from "@tiptap/react"
import type { ActiveTool } from "@/types/editor"

vi.mock("sonner", () => ({
  toast: { warning: vi.fn() },
}))

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
    activeLayerId: "layer-1" as string | null,
    addHighlight: vi.fn().mockReturnValue("h-1"),
    removeHighlight: vi.fn(),
    layers: [] as { id: string; highlights: { id: string; editorIndex: number; from: number; to: number; annotation: string }[] }[],
    selectWord: vi.fn(),
    clearSelection: vi.fn(),
    onHighlightAdded: vi.fn(),
    onArrowClick: vi.fn(),
    ...overrides,
  }
}

describe("useDragSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows warning toast when selection is made without an active layer", () => {
    const opts = createOptions({ activeLayerId: null })
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor, 0)
    })

    expect(toast.warning).toHaveBeenCalledWith("Add a new layer to create annotations")
    expect(opts.addHighlight).not.toHaveBeenCalled()
  })

  it("does not show warning toast when active layer exists", () => {
    const opts = createOptions({ activeLayerId: "layer-1" })
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor, 0)
    })

    expect(toast.warning).not.toHaveBeenCalled()
    expect(opts.addHighlight).toHaveBeenCalled()
  })

  it("still sets word selection even without active layer", () => {
    const opts = createOptions({ activeLayerId: null })
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor, 0)
    })

    expect(opts.selectWord).toHaveBeenCalled()
  })

  it("does not create highlight when activeTool is not comments", () => {
    const opts = createOptions({ activeTool: "selection" })
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor, 0)
    })

    expect(opts.addHighlight).not.toHaveBeenCalled()
    // But word selection still happens
    expect(opts.selectWord).toHaveBeenCalled()
  })

  it("does not create highlight when activeTool is arrow", () => {
    const opts = createOptions({ activeTool: "arrow" })
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor, 0)
    })

    expect(opts.addHighlight).not.toHaveBeenCalled()
    expect(opts.selectWord).toHaveBeenCalled()
  })

  it("creates highlight when activeTool is comments", () => {
    const opts = createOptions({ activeTool: "comments" })
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor, 0)
    })

    expect(opts.addHighlight).toHaveBeenCalled()
  })

  it("calls onArrowClick when activeTool is arrow", () => {
    const opts = createOptions({ activeTool: "arrow" })
    const { result } = renderHook(() => useDragSelection(opts))
    const editor = createMockEditor()

    act(() => {
      result.current.handleMouseDown(createMockEvent(), editor, 0)
    })
    act(() => {
      result.current.handleMouseUp(createMockEvent(), editor, 0)
    })

    expect(opts.onArrowClick).toHaveBeenCalledWith({
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
    })
    expect(opts.addHighlight).not.toHaveBeenCalled()
  })
})
