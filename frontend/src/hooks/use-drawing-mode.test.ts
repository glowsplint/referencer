import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { toast } from "sonner"
import { useDrawingMode } from "./use-drawing-mode"
import type { WordSelection, ActiveTool } from "@/types/editor"

vi.mock("sonner", () => ({
  toast: { warning: vi.fn() },
}))

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "arrow" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addArrow: vi.fn(),
    ...overrides,
  }
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" }
const word2: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "world" }

describe("useDrawingMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does nothing when activeTool is not arrow", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 })
    const { result } = renderHook(() => useDrawingMode(opts))

    act(() => { result.current.handleArrowClick(word1) })

    // handleArrowClick still works but clearing happens at render
    // When tool is not arrow, anchor gets cleared immediately
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("does nothing when isLocked is false", () => {
    const { result } = renderHook(() =>
      useDrawingMode({ ...createOptions({ isLocked: false }), selection: word1 })
    )

    act(() => { result.current.handleArrowClick(word1) })

    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("sets anchor on first handleArrowClick", () => {
    const { result } = renderHook(() => useDrawingMode(createOptions()))

    act(() => { result.current.handleArrowClick(word1) })

    expect(result.current.drawingState).toEqual({
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
    })
    expect(result.current.isDrawing).toBe(true)
  })

  it("creates arrow on second click with different word", () => {
    const addArrow = vi.fn()
    const { result } = renderHook(() =>
      useDrawingMode({
        isLocked: true,
        activeTool: "arrow",
        selection: null,
        activeLayerId: "layer-1",
        addArrow,
      })
    )

    // First click — sets anchor
    act(() => { result.current.handleArrowClick(word1) })
    expect(result.current.isDrawing).toBe(true)

    // Second click — creates arrow
    act(() => { result.current.handleArrowClick(word2) })

    expect(addArrow).toHaveBeenCalledWith("layer-1", {
      from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      to: { editorIndex: 0, from: 10, to: 15, text: "world" },
    })
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("cancels when same word is clicked again", () => {
    const addArrow = vi.fn()
    const { result } = renderHook(() =>
      useDrawingMode({
        isLocked: true,
        activeTool: "arrow",
        selection: null,
        activeLayerId: "layer-1",
        addArrow,
      })
    )

    act(() => { result.current.handleArrowClick(word1) })
    expect(result.current.isDrawing).toBe(true)

    act(() => { result.current.handleArrowClick(word1) })
    expect(addArrow).not.toHaveBeenCalled()
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("shows error toast when no active layer on first click", () => {
    const { result } = renderHook(() =>
      useDrawingMode({
        isLocked: true,
        activeTool: "arrow",
        selection: null,
        activeLayerId: null,
        addArrow: vi.fn(),
      })
    )

    act(() => { result.current.handleArrowClick(word1) })

    expect(toast.warning).toHaveBeenCalledWith("Add a new layer before drawing arrows")
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("clears drawing state when switching away from arrow tool", () => {
    const { result, rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useDrawingMode({
          isLocked: true,
          activeTool: props.activeTool,
          selection: null,
          activeLayerId: "layer-1",
          addArrow: vi.fn(),
        }),
      { initialProps: { activeTool: "arrow" as ActiveTool } }
    )

    act(() => { result.current.handleArrowClick(word1) })
    expect(result.current.isDrawing).toBe(true)

    rerender({ activeTool: "selection" })
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("clears drawing state on unlock", () => {
    const { result, rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useDrawingMode({
          isLocked: props.isLocked,
          activeTool: "arrow",
          selection: null,
          activeLayerId: "layer-1",
          addArrow: vi.fn(),
        }),
      { initialProps: { isLocked: true } }
    )

    act(() => { result.current.handleArrowClick(word1) })
    expect(result.current.isDrawing).toBe(true)

    rerender({ isLocked: false })
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("updates preview cursor when selection changes with anchor set", () => {
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode({
          isLocked: true,
          activeTool: "arrow",
          selection: props.selection,
          activeLayerId: "layer-1",
          addArrow: vi.fn(),
        }),
      { initialProps: { selection: null } }
    )

    // Set anchor via click
    act(() => { result.current.handleArrowClick(word1) })
    expect(result.current.drawingState?.cursor).toEqual({
      editorIndex: 0, from: 1, to: 5, text: "hello",
    })

    // Selection changes (e.g., keyboard navigation) — cursor updates
    rerender({ selection: word2 })
    expect(result.current.drawingState?.anchor).toEqual({
      editorIndex: 0, from: 1, to: 5, text: "hello",
    })
    expect(result.current.drawingState?.cursor).toEqual({
      editorIndex: 0, from: 10, to: 15, text: "world",
    })
  })
})
