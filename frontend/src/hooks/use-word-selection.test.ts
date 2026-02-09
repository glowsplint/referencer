import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useWordSelection } from "./use-word-selection"
import { createRef } from "react"
import type { Editor } from "@tiptap/react"

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    editorsRef: { current: new Map() } as React.RefObject<Map<number, Editor>>,
    containerRef: createRef<HTMLDivElement>(),
    editorCount: 1,
    ...overrides,
  }
}

describe("useWordSelection", () => {
  it("starts with null selection", () => {
    const { result } = renderHook(() => useWordSelection(createOptions()))
    expect(result.current.selection).toBeNull()
  })

  it("selectWord sets selection", () => {
    const { result } = renderHook(() => useWordSelection(createOptions()))

    act(() => {
      result.current.selectWord(0, 1, 5, "hello")
    })

    expect(result.current.selection).toEqual({
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
    })
  })

  it("clearSelection resets to null", () => {
    const { result } = renderHook(() => useWordSelection(createOptions()))

    act(() => {
      result.current.selectWord(0, 1, 5, "hello")
    })
    expect(result.current.selection).not.toBeNull()

    act(() => {
      result.current.clearSelection()
    })
    expect(result.current.selection).toBeNull()
  })

  it("clears selection when isLocked becomes false", () => {
    const { result, rerender } = renderHook(
      (props: { isLocked: boolean }) => useWordSelection(createOptions({ isLocked: props.isLocked })),
      { initialProps: { isLocked: true } }
    )

    act(() => {
      result.current.selectWord(0, 1, 5, "hello")
    })
    expect(result.current.selection).not.toBeNull()

    rerender({ isLocked: false })
    expect(result.current.selection).toBeNull()
  })

  it("rejects non-alphanumeric text", () => {
    const { result } = renderHook(() => useWordSelection(createOptions()))

    act(() => {
      result.current.selectWord(0, 1, 2, "!")
    })
    expect(result.current.selection).toBeNull()
  })

  it("accepts text with alphanumeric characters", () => {
    const { result } = renderHook(() => useWordSelection(createOptions()))

    act(() => {
      result.current.selectWord(0, 1, 5, "test123")
    })
    expect(result.current.selection).toEqual({
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "test123",
    })
  })
})
