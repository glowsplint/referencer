import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useToolShortcuts } from "./use-tool-shortcuts"

function fireKeyDown(code: string, options: Partial<KeyboardEvent> = {}) {
  const { repeat = false, ...rest } = options
  document.dispatchEvent(
    new KeyboardEvent("keydown", { code, repeat, ...rest })
  )
}

function fireKeyUp(code: string) {
  document.dispatchEvent(new KeyboardEvent("keyup", { code }))
}

describe("useToolShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("pressing S sets selection tool", () => {
    const setActiveTool = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }))

    act(() => { fireKeyDown("KeyS") })
    expect(setActiveTool).toHaveBeenCalledWith("selection")
  })

  it("pressing A sets arrow tool", () => {
    const setActiveTool = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }))

    act(() => { fireKeyDown("KeyA") })
    expect(setActiveTool).toHaveBeenCalledWith("arrow")
  })

  it("pressing C sets comments tool", () => {
    const setActiveTool = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }))

    act(() => { fireKeyDown("KeyC") })
    expect(setActiveTool).toHaveBeenCalledWith("comments")
  })

  it("does nothing when isLocked is false", () => {
    const setActiveTool = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: false, setActiveTool }))

    act(() => { fireKeyDown("KeyA") })
    expect(setActiveTool).not.toHaveBeenCalled()
  })

  it("ignores repeat keydown events", () => {
    const setActiveTool = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }))

    act(() => { fireKeyDown("KeyA", { repeat: true }) })
    expect(setActiveTool).not.toHaveBeenCalled()
  })

  it("ignores unrelated keys", () => {
    const setActiveTool = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }))

    act(() => { fireKeyDown("KeyB") })
    act(() => { fireKeyDown("KeyX") })
    expect(setActiveTool).not.toHaveBeenCalled()
  })

  it.each([
    { modifier: "metaKey" },
    { modifier: "ctrlKey" },
    { modifier: "altKey" },
    { modifier: "shiftKey" },
  ])("ignores shortcut when $modifier is held", ({ modifier }) => {
    const setActiveTool = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }))

    act(() => { fireKeyDown("KeyS", { [modifier]: true }) })
    expect(setActiveTool).not.toHaveBeenCalled()
  })

  it("ignores keys when target is editable element", () => {
    const setActiveTool = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }))

    const textarea = document.createElement("textarea")
    document.body.appendChild(textarea)
    textarea.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA", bubbles: true }))
    document.body.removeChild(textarea)

    expect(setActiveTool).not.toHaveBeenCalled()
  })

  it("starts listening when isLocked changes to true", () => {
    const setActiveTool = vi.fn()
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useToolShortcuts({ isLocked: props.isLocked, setActiveTool }),
      { initialProps: { isLocked: false } }
    )

    act(() => { fireKeyDown("KeyA") })
    expect(setActiveTool).not.toHaveBeenCalled()

    rerender({ isLocked: true })

    act(() => { fireKeyDown("KeyA") })
    expect(setActiveTool).toHaveBeenCalledWith("arrow")
  })

  it("short press A with onArrowLongPress still activates arrow tool", () => {
    vi.useFakeTimers()
    const setActiveTool = vi.fn()
    const onArrowLongPress = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool, onArrowLongPress }))

    act(() => { fireKeyDown("KeyA") })
    act(() => { vi.advanceTimersByTime(200) })
    act(() => { fireKeyUp("KeyA") })

    expect(setActiveTool).toHaveBeenCalledWith("arrow")
    expect(onArrowLongPress).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it("long press A (500ms) calls onArrowLongPress instead of setActiveTool", () => {
    vi.useFakeTimers()
    const setActiveTool = vi.fn()
    const onArrowLongPress = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool, onArrowLongPress }))

    act(() => { fireKeyDown("KeyA") })
    act(() => { vi.advanceTimersByTime(500) })

    expect(onArrowLongPress).toHaveBeenCalledOnce()
    expect(setActiveTool).not.toHaveBeenCalled()

    // keyup after long press should not activate tool
    act(() => { fireKeyUp("KeyA") })
    expect(setActiveTool).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it("A key without onArrowLongPress activates arrow tool immediately on keydown", () => {
    const setActiveTool = vi.fn()
    renderHook(() => useToolShortcuts({ isLocked: true, setActiveTool }))

    act(() => { fireKeyDown("KeyA") })
    expect(setActiveTool).toHaveBeenCalledWith("arrow")
  })
})
