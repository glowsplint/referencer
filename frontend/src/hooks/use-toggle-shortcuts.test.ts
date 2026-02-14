import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useToggleShortcuts } from "./use-toggle-shortcuts"

function fireKeyDown(code: string, options: Partial<KeyboardEvent> = {}) {
  const { repeat = false, ...rest } = options
  document.dispatchEvent(
    new KeyboardEvent("keydown", { code, repeat, ...rest })
  )
}

function makeCallbacks() {
  return {
    toggleDarkMode: vi.fn(),
    toggleMultipleRowsLayout: vi.fn(),
    toggleLocked: vi.fn(),
    toggleManagementPane: vi.fn(),
  }
}

describe("useToggleShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("pressing D toggles dark mode", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    act(() => { fireKeyDown("KeyD") })
    expect(callbacks.toggleDarkMode).toHaveBeenCalledOnce()
  })

  it("pressing R toggles layout", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    act(() => { fireKeyDown("KeyR") })
    expect(callbacks.toggleMultipleRowsLayout).toHaveBeenCalledOnce()
  })

  it("pressing K toggles lock", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    act(() => { fireKeyDown("KeyK") })
    expect(callbacks.toggleLocked).toHaveBeenCalledOnce()
  })

  it("pressing M toggles management pane", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    act(() => { fireKeyDown("KeyM") })
    expect(callbacks.toggleManagementPane).toHaveBeenCalledOnce()
  })

  it("ignores repeat keydown events", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    act(() => { fireKeyDown("KeyD", { repeat: true }) })
    expect(callbacks.toggleDarkMode).not.toHaveBeenCalled()
  })

  it("ignores unrelated keys", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    act(() => { fireKeyDown("KeyB") })
    act(() => { fireKeyDown("KeyX") })
    expect(callbacks.toggleDarkMode).not.toHaveBeenCalled()
    expect(callbacks.toggleMultipleRowsLayout).not.toHaveBeenCalled()
    expect(callbacks.toggleLocked).not.toHaveBeenCalled()
    expect(callbacks.toggleManagementPane).not.toHaveBeenCalled()
  })

  it.each([
    { modifier: "metaKey" },
    { modifier: "ctrlKey" },
    { modifier: "altKey" },
    { modifier: "shiftKey" },
  ])("ignores shortcut when $modifier is held", ({ modifier }) => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    act(() => { fireKeyDown("KeyR", { [modifier]: true }) })
    expect(callbacks.toggleMultipleRowsLayout).not.toHaveBeenCalled()
  })

  it("ignores keys when target is editable element", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    const textarea = document.createElement("textarea")
    document.body.appendChild(textarea)
    textarea.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyD", bubbles: true }))
    document.body.removeChild(textarea)

    expect(callbacks.toggleDarkMode).not.toHaveBeenCalled()
  })
})
