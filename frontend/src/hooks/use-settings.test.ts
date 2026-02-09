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
    })
  })

  it("returns initial annotations state", () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.annotations).toEqual({ isPainterMode: false })
  })

  it("toggleSetting toggles isDarkMode and updates classList", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleSetting("isDarkMode")() })
    expect(result.current.settings.isDarkMode).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => { result.current.toggleSetting("isDarkMode")() })
    expect(result.current.settings.isDarkMode).toBe(false)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("toggleSetting toggles isLayersOn", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleSetting("isLayersOn")() })
    expect(result.current.settings.isLayersOn).toBe(true)
  })

  it("toggleSetting toggles isMultipleRowsLayout", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleSetting("isMultipleRowsLayout")() })
    expect(result.current.settings.isMultipleRowsLayout).toBe(true)
  })

  it("toggleSetting toggles isLocked", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleSetting("isLocked")() })
    expect(result.current.settings.isLocked).toBe(true)
  })

  it("togglePainterMode toggles isPainterMode", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.togglePainterMode() })
    expect(result.current.annotations.isPainterMode).toBe(true)

    act(() => { result.current.togglePainterMode() })
    expect(result.current.annotations.isPainterMode).toBe(false)
  })

  it("toggling one setting does not affect others", () => {
    const { result } = renderHook(() => useSettings())

    act(() => { result.current.toggleSetting("isDarkMode")() })

    expect(result.current.settings.isLayersOn).toBe(false)
    expect(result.current.settings.isMultipleRowsLayout).toBe(false)
    expect(result.current.settings.isLocked).toBe(false)
  })
})
