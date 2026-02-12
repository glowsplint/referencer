import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSettings } from "./use-settings"

beforeEach(() => {
  vi.clearAllMocks()
  document.documentElement.classList.remove("dark")
})

describe("useSettings", () => {
  it("returns initial settings state", () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.settings).toEqual({
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: false,
      showDrawingToasts: true,
    })
  })

  it("returns initial annotations state", () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.annotations).toEqual({ activeTool: "selection" })
  })

  it("toggleDarkMode toggles isDarkMode and updates classList", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleDarkMode() })
    expect(result.current.settings.isDarkMode).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => { result.current.toggleDarkMode() })
    expect(result.current.settings.isDarkMode).toBe(false)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("toggleLayersOn toggles isLayersOn", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleLayersOn() })
    expect(result.current.settings.isLayersOn).toBe(true)
  })

  it("toggleMultipleRowsLayout toggles isMultipleRowsLayout", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleMultipleRowsLayout() })
    expect(result.current.settings.isMultipleRowsLayout).toBe(true)
  })

  it("toggleLocked toggles isLocked", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleLocked() })
    expect(result.current.settings.isLocked).toBe(true)
  })

  it("setActiveTool changes the active tool", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.setActiveTool("arrow") })
    expect(result.current.annotations.activeTool).toBe("arrow")

    act(() => { result.current.setActiveTool("comments") })
    expect(result.current.annotations.activeTool).toBe("comments")

    act(() => { result.current.setActiveTool("selection") })
    expect(result.current.annotations.activeTool).toBe("selection")
  })

  it("toggleShowDrawingToasts toggles showDrawingToasts", () => {
    const { result } = renderHook(() => useSettings())

    expect(result.current.settings.showDrawingToasts).toBe(true)

    act(() => { result.current.toggleShowDrawingToasts() })
    expect(result.current.settings.showDrawingToasts).toBe(false)

    act(() => { result.current.toggleShowDrawingToasts() })
    expect(result.current.settings.showDrawingToasts).toBe(true)
  })

  it("toggling one setting does not affect others", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleDarkMode() })

    expect(result.current.settings.isLayersOn).toBe(false)
    expect(result.current.settings.isMultipleRowsLayout).toBe(false)
    expect(result.current.settings.isLocked).toBe(false)
    expect(result.current.settings.showDrawingToasts).toBe(true)
  })
})
