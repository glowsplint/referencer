import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useEditorWorkspace } from "./use-editor-workspace"

beforeEach(() => {
  vi.clearAllMocks()
  document.documentElement.classList.remove("dark")
})

describe("useEditorWorkspace", () => {
  it("returns initial state", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    expect(result.current.settings).toEqual({
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: false,
    })
    expect(result.current.annotations).toEqual({ isPainterMode: false })
    expect(result.current.editorCount).toBe(1)
    expect(result.current.activeEditor).toBeNull()
    expect(result.current.editorWidths).toEqual([100])
  })

  it("toggleSetting toggles isDarkMode", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.toggleSetting("isDarkMode")()
    })

    expect(result.current.settings.isDarkMode).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => {
      result.current.toggleSetting("isDarkMode")()
    })

    expect(result.current.settings.isDarkMode).toBe(false)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("toggleSetting toggles isLocked", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.toggleSetting("isLocked")()
    })

    expect(result.current.settings.isLocked).toBe(true)
  })

  it("togglePainterMode toggles isPainterMode", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.togglePainterMode()
    })

    expect(result.current.annotations.isPainterMode).toBe(true)

    act(() => {
      result.current.togglePainterMode()
    })

    expect(result.current.annotations.isPainterMode).toBe(false)
  })

  it("addEditor increments editor count up to 3", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    expect(result.current.editorCount).toBe(1)

    act(() => {
      result.current.addEditor()
    })
    expect(result.current.editorCount).toBe(2)
    expect(result.current.editorWidths).toHaveLength(2)

    act(() => {
      result.current.addEditor()
    })
    expect(result.current.editorCount).toBe(3)
    expect(result.current.editorWidths).toHaveLength(3)

    // Should not exceed 3
    act(() => {
      result.current.addEditor()
    })
    expect(result.current.editorCount).toBe(3)
  })

  it("editorWidths are evenly distributed after adding editors", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addEditor()
    })

    // 2 editors: each ~50%
    expect(result.current.editorWidths[0]).toBeCloseTo(50, 0)
    expect(result.current.editorWidths[1]).toBeCloseTo(50, 0)

    act(() => {
      result.current.addEditor()
    })

    // 3 editors: each ~33%
    expect(result.current.editorWidths[0]).toBeCloseTo(33.3, 0)
    expect(result.current.editorWidths[1]).toBeCloseTo(33.3, 0)
    expect(result.current.editorWidths[2]).toBeCloseTo(33.3, 0)
  })

  it("handleDividerResize clamps within bounds", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    // Add a second editor to have a divider
    act(() => {
      result.current.addEditor()
    })

    // Resize to 70%
    act(() => {
      result.current.handleDividerResize(0, 70)
    })

    expect(result.current.editorWidths[0]).toBeCloseTo(70, 0)
    expect(result.current.editorWidths[1]).toBeCloseTo(30, 0)

    // Try to resize beyond max (90% = 100% - 10% MIN_EDITOR_PCT)
    act(() => {
      result.current.handleDividerResize(0, 95)
    })

    expect(result.current.editorWidths[0]).toBe(90)
    expect(result.current.editorWidths[1]).toBe(10)

    // Try to resize below min (10% MIN_EDITOR_PCT)
    act(() => {
      result.current.handleDividerResize(0, 5)
    })

    expect(result.current.editorWidths[0]).toBe(10)
    expect(result.current.editorWidths[1]).toBe(90)
  })

  it("handleEditorMount sets activeEditor for index 0", () => {
    const { result } = renderHook(() => useEditorWorkspace())
    const mockEditor = { id: "editor-0" } as any

    act(() => {
      result.current.handleEditorMount(0, mockEditor)
    })

    expect(result.current.activeEditor).toBe(mockEditor)
  })

  it("handleEditorMount does not set activeEditor for non-zero index", () => {
    const { result } = renderHook(() => useEditorWorkspace())
    const mockEditor = { id: "editor-1" } as any

    act(() => {
      result.current.handleEditorMount(1, mockEditor)
    })

    expect(result.current.activeEditor).toBeNull()
  })

  it("handlePaneFocus switches activeEditor", () => {
    const { result } = renderHook(() => useEditorWorkspace())
    const editor0 = { id: "editor-0" } as any
    const editor1 = { id: "editor-1" } as any

    act(() => {
      result.current.handleEditorMount(0, editor0)
      result.current.handleEditorMount(1, editor1)
    })

    expect(result.current.activeEditor).toBe(editor0)

    act(() => {
      result.current.handlePaneFocus(1)
    })

    expect(result.current.activeEditor).toBe(editor1)
  })
})
