import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDrawingMode } from "./use-drawing-mode"
import type { WordSelection } from "@/types/editor"

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addArrow: vi.fn(),
    ...overrides,
  }
}

function fireKeyDown(key: string, repeat = false, code?: string) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, code: code ?? `Key${key.toUpperCase()}`, repeat }))
}

function fireKeyUp(key: string, code?: string) {
  document.dispatchEvent(new KeyboardEvent("keyup", { key, code: code ?? `Key${key.toUpperCase()}` }))
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" }
const word2: WordSelection = { editorIndex: 0, from: 10, to: 15, text: "world" }

describe("useDrawingMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does nothing when isLocked is false", () => {
    const opts = createOptions({ isLocked: false, selection: word1 })
    const { result } = renderHook(() => useDrawingMode(opts))

    act(() => { fireKeyDown("a") })

    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("sets drawingState on 'a' keydown when selection exists", () => {
    const opts = createOptions({ selection: word1 })
    const { result } = renderHook(() => useDrawingMode(opts))

    act(() => { fireKeyDown("a") })

    expect(result.current.drawingState).toEqual({
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
    })
    expect(result.current.isDrawing).toBe(true)
  })

  it("does not set drawingState when no selection", () => {
    const opts = createOptions({ selection: null })
    const { result } = renderHook(() => useDrawingMode(opts))

    act(() => { fireKeyDown("a") })

    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("ignores repeat keydown events", () => {
    const opts = createOptions({ selection: word1 })
    const { result } = renderHook(() => useDrawingMode(opts))

    act(() => { fireKeyDown("a") })
    expect(result.current.isDrawing).toBe(true)

    act(() => { fireKeyDown("a", true) })
    expect(result.current.isDrawing).toBe(true)
  })

  it("updates cursor when selection changes during drawing", () => {
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode({ ...createOptions(), selection: props.selection }),
      { initialProps: { selection: word1 } }
    )

    act(() => { fireKeyDown("a") })
    expect(result.current.drawingState?.cursor).toEqual({
      editorIndex: 0, from: 1, to: 5, text: "hello",
    })

    rerender({ selection: word2 })

    expect(result.current.drawingState?.anchor).toEqual({
      editorIndex: 0, from: 1, to: 5, text: "hello",
    })
    expect(result.current.drawingState?.cursor).toEqual({
      editorIndex: 0, from: 10, to: 15, text: "world",
    })
  })

  it("commits arrow on 'a' keyup when anchor !== cursor", () => {
    const addArrow = vi.fn()
    const { result, rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode({
          isLocked: true,
          selection: props.selection,
          activeLayerId: "layer-1",
          addArrow,
        }),
      { initialProps: { selection: word1 } }
    )

    act(() => { fireKeyDown("a") })

    rerender({ selection: word2 })

    act(() => { fireKeyUp("a") })

    expect(addArrow).toHaveBeenCalledWith("layer-1", {
      from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      to: { editorIndex: 0, from: 10, to: 15, text: "world" },
    })
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("does not commit when anchor === cursor", () => {
    const addArrow = vi.fn()
    const opts = createOptions({ selection: word1, addArrow })
    const { result } = renderHook(() => useDrawingMode(opts))

    act(() => { fireKeyDown("a") })
    act(() => { fireKeyUp("a") })

    expect(addArrow).not.toHaveBeenCalled()
    expect(result.current.drawingState).toBeNull()
  })

  it("does not commit when activeLayerId is null", () => {
    const addArrow = vi.fn()
    const { rerender } = renderHook(
      (props: { selection: WordSelection | null }) =>
        useDrawingMode({
          isLocked: true,
          selection: props.selection,
          activeLayerId: null,
          addArrow,
        }),
      { initialProps: { selection: word1 } }
    )

    act(() => { fireKeyDown("a") })
    rerender({ selection: word2 })
    act(() => { fireKeyUp("a") })

    expect(addArrow).not.toHaveBeenCalled()
  })

  it("clears drawingState on unlock", () => {
    const { result, rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useDrawingMode({
          ...createOptions({ selection: word1 }),
          isLocked: props.isLocked,
        }),
      { initialProps: { isLocked: true } }
    )

    act(() => { fireKeyDown("a") })
    expect(result.current.isDrawing).toBe(true)

    rerender({ isLocked: false })
    expect(result.current.drawingState).toBeNull()
    expect(result.current.isDrawing).toBe(false)
  })

  it("ignores non-'a' keys", () => {
    const opts = createOptions({ selection: word1 })
    const { result } = renderHook(() => useDrawingMode(opts))

    act(() => { fireKeyDown("b") })
    expect(result.current.drawingState).toBeNull()

    act(() => { fireKeyDown("a") })
    expect(result.current.isDrawing).toBe(true)

    act(() => { fireKeyUp("b") })
    expect(result.current.isDrawing).toBe(true)
  })
})
