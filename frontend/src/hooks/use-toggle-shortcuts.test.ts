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

  it("ignores non-lock keys when target is editable element", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    const textarea = document.createElement("textarea")
    document.body.appendChild(textarea)
    textarea.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyD", bubbles: true }))
    document.body.removeChild(textarea)

    expect(callbacks.toggleDarkMode).not.toHaveBeenCalled()
  })

  it("K toggles lock even when target is contentEditable element", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    const editableDiv = document.createElement("div")
    editableDiv.contentEditable = "true"
    document.body.appendChild(editableDiv)
    editableDiv.focus()

    editableDiv.dispatchEvent(
      new KeyboardEvent("keydown", { code: "KeyK", bubbles: true })
    )

    expect(callbacks.toggleLocked).toHaveBeenCalledOnce()
    document.body.removeChild(editableDiv)
  })

  it("K blurs active element before toggling lock", () => {
    const callbacks = makeCallbacks()
    // Track the order: blur must happen before toggleLocked
    const callOrder: string[] = []
    callbacks.toggleLocked = vi.fn(() => callOrder.push("lock"))

    renderHook(() => useToggleShortcuts(callbacks))

    const editableDiv = document.createElement("div")
    editableDiv.contentEditable = "true"
    document.body.appendChild(editableDiv)
    editableDiv.focus()

    // Spy on blur of whatever is activeElement
    const originalBlur = HTMLElement.prototype.blur
    HTMLElement.prototype.blur = vi.fn(function (this: HTMLElement) {
      callOrder.push("blur")
      return originalBlur.call(this)
    })

    editableDiv.dispatchEvent(
      new KeyboardEvent("keydown", { code: "KeyK", bubbles: true })
    )

    expect(callOrder).toContain("blur")
    expect(callOrder).toContain("lock")
    expect(callOrder.indexOf("blur")).toBeLessThan(callOrder.indexOf("lock"))

    HTMLElement.prototype.blur = originalBlur
    document.body.removeChild(editableDiv)
  })

  it("Escape blurs editable element", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    const editableDiv = document.createElement("div")
    editableDiv.contentEditable = "true"
    editableDiv.tabIndex = 0
    document.body.appendChild(editableDiv)
    editableDiv.focus()

    expect(document.activeElement).toBe(editableDiv)

    editableDiv.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Escape", bubbles: true })
    )

    expect(document.activeElement).not.toBe(editableDiv)
    document.body.removeChild(editableDiv)
  })

  it("Escape does not blur non-editable elements", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    const div = document.createElement("div")
    document.body.appendChild(div)
    div.focus()

    div.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Escape", bubbles: true })
    )

    // Should not trigger any toggle
    expect(callbacks.toggleLocked).not.toHaveBeenCalled()
    document.body.removeChild(div)
  })

  it("D does not toggle dark mode from inside input element", () => {
    const callbacks = makeCallbacks()
    renderHook(() => useToggleShortcuts(callbacks))

    const input = document.createElement("input")
    document.body.appendChild(input)
    input.dispatchEvent(
      new KeyboardEvent("keydown", { code: "KeyD", bubbles: true })
    )
    document.body.removeChild(input)

    expect(callbacks.toggleDarkMode).not.toHaveBeenCalled()
  })
})
