import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useEraserMode } from "./use-eraser-mode"
import type { WordSelection, ActiveTool, Layer } from "@/types/editor"

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "eraser" as ActiveTool,
    selection: null as WordSelection | null,
    layers: [] as Layer[],
    removeHighlight: vi.fn(),
    removeUnderline: vi.fn(),
    setStatus: vi.fn(),
    flashStatus: vi.fn(),
    clearStatus: vi.fn(),
    ...overrides,
  }
}

function makeLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "layer-1",
    name: "Layer 1",
    color: "#fca5a5",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
    ...overrides,
  }
}

const word1: WordSelection = { editorIndex: 0, from: 5, to: 10, text: "hello" }

describe("useEraserMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows status when eraser tool is active and locked", () => {
    const setStatus = vi.fn()
    renderHook(() => useEraserMode(createOptions({ setStatus })))

    expect(setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Click and drag to erase highlights and underlines.", type: "info" })
    )
  })

  it("clears status when switching away from eraser tool", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useEraserMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "eraser" as ActiveTool } }
    )

    rerender({ activeTool: "selection" })
    expect(clearStatus).toHaveBeenCalled()
  })

  it("clears status when unlocking while eraser is active", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useEraserMode(createOptions({ isLocked: props.isLocked, clearStatus })),
      { initialProps: { isLocked: true } }
    )

    rerender({ isLocked: false })
    expect(clearStatus).toHaveBeenCalled()
  })

  it("does nothing when activeTool is not eraser", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeHighlight).not.toHaveBeenCalled()
    expect(opts.removeUnderline).not.toHaveBeenCalled()
  })

  it("does nothing when isLocked is false", () => {
    const opts = createOptions({ isLocked: false, selection: word1 })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeHighlight).not.toHaveBeenCalled()
    expect(opts.removeUnderline).not.toHaveBeenCalled()
  })

  it("does nothing when there is no selection", () => {
    const opts = createOptions({ selection: null })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeHighlight).not.toHaveBeenCalled()
    expect(opts.removeUnderline).not.toHaveBeenCalled()
  })

  it("erases overlapping highlight on visible layer", () => {
    const layer = makeLayer({
      highlights: [
        { id: "h-1", editorIndex: 0, from: 3, to: 8, text: "llo w", annotation: "", type: "highlight" },
      ],
    })
    const opts = createOptions({ selection: word1, layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-1")
  })

  it("erases overlapping underline on visible layer", () => {
    const layer = makeLayer({
      underlines: [
        { id: "u-1", editorIndex: 0, from: 6, to: 12, text: "ello w" },
      ],
    })
    const opts = createOptions({ selection: word1, layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeUnderline).toHaveBeenCalledWith("layer-1", "u-1")
  })

  it("erases both highlight and underline when overlapping", () => {
    const layer = makeLayer({
      highlights: [
        { id: "h-1", editorIndex: 0, from: 5, to: 10, text: "hello", annotation: "", type: "highlight" },
      ],
      underlines: [
        { id: "u-1", editorIndex: 0, from: 5, to: 10, text: "hello" },
      ],
    })
    const opts = createOptions({ selection: word1, layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-1")
    expect(opts.removeUnderline).toHaveBeenCalledWith("layer-1", "u-1")
  })

  it("skips decorations on hidden layers", () => {
    const layer = makeLayer({
      visible: false,
      highlights: [
        { id: "h-1", editorIndex: 0, from: 5, to: 10, text: "hello", annotation: "", type: "highlight" },
      ],
    })
    const opts = createOptions({ selection: word1, layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeHighlight).not.toHaveBeenCalled()
  })

  it("skips decorations on different editor index", () => {
    const layer = makeLayer({
      highlights: [
        { id: "h-1", editorIndex: 1, from: 5, to: 10, text: "hello", annotation: "", type: "highlight" },
      ],
    })
    const opts = createOptions({ selection: word1, layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeHighlight).not.toHaveBeenCalled()
  })

  it("skips non-overlapping decorations", () => {
    const layer = makeLayer({
      highlights: [
        { id: "h-1", editorIndex: 0, from: 15, to: 20, text: "world", annotation: "", type: "highlight" },
      ],
    })
    const opts = createOptions({ selection: word1, layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeHighlight).not.toHaveBeenCalled()
  })

  it("shows success status when something was erased", () => {
    const flashStatus = vi.fn()
    const layer = makeLayer({
      highlights: [
        { id: "h-1", editorIndex: 0, from: 5, to: 10, text: "hello", annotation: "", type: "highlight" },
      ],
    })
    const opts = createOptions({ selection: word1, layers: [layer], flashStatus })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(flashStatus).toHaveBeenCalledWith(
      { text: "Erased decoration.", type: "success" }, 3000
    )
  })

  it("does not show success status when nothing was erased", () => {
    const setStatus = vi.fn()
    const layer = makeLayer()
    const opts = createOptions({ selection: word1, layers: [layer], setStatus })
    const { result } = renderHook(() => useEraserMode(opts))

    // Clear the info status call from the effect
    setStatus.mockClear()

    act(() => { result.current.confirmErase() })

    const successCalls = setStatus.mock.calls.filter(
      (c: unknown[]) => (c[0] as { type: string })?.type === "success"
    )
    expect(successCalls).toHaveLength(0)
  })

  // --- eraseAtPosition tests ---

  it("eraseAtPosition erases overlapping highlight at given position", () => {
    const layer = makeLayer({
      highlights: [
        { id: "h-1", editorIndex: 0, from: 3, to: 8, text: "llo w", annotation: "", type: "highlight" },
      ],
    })
    const opts = createOptions({ layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.eraseAtPosition(0, 5, 10) })

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-1")
  })

  it("eraseAtPosition erases overlapping underline at given position", () => {
    const layer = makeLayer({
      underlines: [
        { id: "u-1", editorIndex: 0, from: 6, to: 12, text: "ello w" },
      ],
    })
    const opts = createOptions({ layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.eraseAtPosition(0, 5, 10) })

    expect(opts.removeUnderline).toHaveBeenCalledWith("layer-1", "u-1")
  })

  it("eraseAtPosition does nothing when not in eraser mode", () => {
    const layer = makeLayer({
      highlights: [
        { id: "h-1", editorIndex: 0, from: 5, to: 10, text: "hello", annotation: "", type: "highlight" },
      ],
    })
    const opts = createOptions({ activeTool: "selection", layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.eraseAtPosition(0, 5, 10) })

    expect(opts.removeHighlight).not.toHaveBeenCalled()
  })

  it("eraseAtPosition skips hidden layers", () => {
    const layer = makeLayer({
      visible: false,
      highlights: [
        { id: "h-1", editorIndex: 0, from: 5, to: 10, text: "hello", annotation: "", type: "highlight" },
      ],
    })
    const opts = createOptions({ layers: [layer] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.eraseAtPosition(0, 5, 10) })

    expect(opts.removeHighlight).not.toHaveBeenCalled()
  })

  it("erases decorations across multiple visible layers", () => {
    const layer1 = makeLayer({
      id: "layer-1",
      highlights: [
        { id: "h-1", editorIndex: 0, from: 5, to: 10, text: "hello", annotation: "", type: "highlight" },
      ],
    })
    const layer2 = makeLayer({
      id: "layer-2",
      underlines: [
        { id: "u-1", editorIndex: 0, from: 7, to: 12, text: "lo wo" },
      ],
    })
    const opts = createOptions({ selection: word1, layers: [layer1, layer2] })
    const { result } = renderHook(() => useEraserMode(opts))

    act(() => { result.current.confirmErase() })

    expect(opts.removeHighlight).toHaveBeenCalledWith("layer-1", "h-1")
    expect(opts.removeUnderline).toHaveBeenCalledWith("layer-2", "u-1")
  })
})
