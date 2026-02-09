import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useEditors } from "./use-editors"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useEditors", () => {
  it("returns initial state with 1 editor at 100% width", () => {
    const { result } = renderHook(() => useEditors())
    expect(result.current.editorCount).toBe(1)
    expect(result.current.editorWidths).toEqual([100])
    expect(result.current.activeEditor).toBeNull()
  })

  it("addEditor increments editor count up to 3", () => {
    const { result } = renderHook(() => useEditors())

    act(() => { result.current.addEditor() })
    expect(result.current.editorCount).toBe(2)

    act(() => { result.current.addEditor() })
    expect(result.current.editorCount).toBe(3)

    act(() => { result.current.addEditor() })
    expect(result.current.editorCount).toBe(3)
  })

  it("editorWidths are evenly distributed for 2 editors", () => {
    const { result } = renderHook(() => useEditors())

    act(() => { result.current.addEditor() })
    expect(result.current.editorWidths[0]).toBeCloseTo(50, 0)
    expect(result.current.editorWidths[1]).toBeCloseTo(50, 0)
  })

  it("editorWidths are evenly distributed for 3 editors", () => {
    const { result } = renderHook(() => useEditors())

    act(() => { result.current.addEditor(); result.current.addEditor() })
    expect(result.current.editorWidths[0]).toBeCloseTo(33.3, 0)
    expect(result.current.editorWidths[1]).toBeCloseTo(33.3, 0)
    expect(result.current.editorWidths[2]).toBeCloseTo(33.3, 0)
  })

  it("removeEditor decrements editor count and redistributes widths", () => {
    const { result } = renderHook(() => useEditors())

    act(() => { result.current.addEditor(); result.current.addEditor() })
    expect(result.current.editorCount).toBe(3)

    act(() => { result.current.removeEditor(1) })
    expect(result.current.editorCount).toBe(2)
    expect(result.current.editorWidths[0]).toBeCloseTo(50, 0)
    expect(result.current.editorWidths[1]).toBeCloseTo(50, 0)
  })

  it("removeEditor does not go below 1 editor", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.removeEditor(0) })
    expect(result.current.editorCount).toBe(1)
  })

  it("removeEditor sets activeEditor to first remaining editor", () => {
    const { result } = renderHook(() => useEditors())
    const editor0 = { id: "e0" } as any
    const editor1 = { id: "e1" } as any
    const editor2 = { id: "e2" } as any

    act(() => {
      result.current.addEditor()
      result.current.addEditor()
      result.current.handleEditorMount(0, editor0)
      result.current.handleEditorMount(1, editor1)
      result.current.handleEditorMount(2, editor2)
    })

    act(() => { result.current.removeEditor(1) })
    expect(result.current.activeEditor).toBe(editor0)
  })

  it("handleDividerResize clamps within bounds for 2 editors", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor() })

    act(() => { result.current.handleDividerResize(0, 70) })
    expect(result.current.editorWidths[0]).toBeCloseTo(70, 0)
    expect(result.current.editorWidths[1]).toBeCloseTo(30, 0)

    // Clamp at max (90%)
    act(() => { result.current.handleDividerResize(0, 95) })
    expect(result.current.editorWidths[0]).toBe(90)

    // Clamp at min (10%)
    act(() => { result.current.handleDividerResize(0, 5) })
    expect(result.current.editorWidths[0]).toBe(10)
  })

  it("handleDividerResize clamps between adjacent dividers for 3 editors", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor(); result.current.addEditor() })

    // Move first divider to 20%
    act(() => { result.current.handleDividerResize(0, 20) })
    // Move second divider to 80%
    act(() => { result.current.handleDividerResize(1, 80) })

    expect(result.current.editorWidths[0]).toBeCloseTo(20, 0)
    expect(result.current.editorWidths[1]).toBeCloseTo(60, 0)
    expect(result.current.editorWidths[2]).toBeCloseTo(20, 0)

    // Try to move first divider past second divider (should clamp to second - 10%)
    act(() => { result.current.handleDividerResize(0, 75) })
    expect(result.current.editorWidths[0]).toBe(70)

    // Try to move second divider before first divider (should clamp to first + 10%)
    act(() => { result.current.handleDividerResize(1, 25) })
    // First divider is at 70, so second clamps to 70 + 10 = 80
    expect(result.current.editorWidths[1]).toBe(10)
  })

  it("handleEditorMount sets activeEditor for index 0", () => {
    const { result } = renderHook(() => useEditors())
    const editor = { id: "e0" } as any

    act(() => { result.current.handleEditorMount(0, editor) })
    expect(result.current.activeEditor).toBe(editor)
  })

  it("handleEditorMount does not set activeEditor for non-zero index", () => {
    const { result } = renderHook(() => useEditors())
    const editor = { id: "e1" } as any

    act(() => { result.current.handleEditorMount(1, editor) })
    expect(result.current.activeEditor).toBeNull()
  })

  it("handlePaneFocus switches activeEditor", () => {
    const { result } = renderHook(() => useEditors())
    const editor0 = { id: "e0" } as any
    const editor1 = { id: "e1" } as any

    act(() => {
      result.current.handleEditorMount(0, editor0)
      result.current.handleEditorMount(1, editor1)
    })
    expect(result.current.activeEditor).toBe(editor0)

    act(() => { result.current.handlePaneFocus(1) })
    expect(result.current.activeEditor).toBe(editor1)
  })

  it("handlePaneFocus with unmounted index does nothing", () => {
    const { result } = renderHook(() => useEditors())
    const editor = { id: "e0" } as any

    act(() => { result.current.handleEditorMount(0, editor) })
    act(() => { result.current.handlePaneFocus(5) })
    expect(result.current.activeEditor).toBe(editor)
  })

  it("editorsRef is exposed as a Map", () => {
    const { result } = renderHook(() => useEditors())
    expect(result.current.editorsRef.current).toBeInstanceOf(Map)
  })

  it("sectionVisibility starts with one visible section", () => {
    const { result } = renderHook(() => useEditors())
    expect(result.current.sectionVisibility).toEqual([true])
  })

  it("addEditor appends true to sectionVisibility", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor() })
    expect(result.current.sectionVisibility).toEqual([true, true])
    act(() => { result.current.addEditor() })
    expect(result.current.sectionVisibility).toEqual([true, true, true])
  })

  it("removeEditor removes the entry from sectionVisibility", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor(); result.current.addEditor() })
    act(() => { result.current.toggleSectionVisibility(1) })
    expect(result.current.sectionVisibility).toEqual([true, false, true])
    act(() => { result.current.removeEditor(1) })
    expect(result.current.sectionVisibility).toEqual([true, true])
  })

  it("toggleAllSectionVisibility hides all sections when any are visible", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor() })
    act(() => { result.current.toggleSectionVisibility(0) })
    // One hidden, one visible
    expect(result.current.sectionVisibility).toEqual([false, true])

    act(() => { result.current.toggleAllSectionVisibility() })
    expect(result.current.sectionVisibility).toEqual([false, false])
  })

  it("toggleAllSectionVisibility shows all sections when none are visible", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor() })
    act(() => {
      result.current.toggleSectionVisibility(0)
      result.current.toggleSectionVisibility(1)
    })
    expect(result.current.sectionVisibility).toEqual([false, false])

    act(() => { result.current.toggleAllSectionVisibility() })
    expect(result.current.sectionVisibility).toEqual([true, true])
  })

  it("toggleSectionVisibility toggles visibility at index", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor() })
    expect(result.current.sectionVisibility).toEqual([true, true])

    act(() => { result.current.toggleSectionVisibility(0) })
    expect(result.current.sectionVisibility).toEqual([false, true])

    act(() => { result.current.toggleSectionVisibility(0) })
    expect(result.current.sectionVisibility).toEqual([true, true])
  })

  // --- Section names ---

  it("sectionNames starts with ['Passage 1']", () => {
    const { result } = renderHook(() => useEditors())
    expect(result.current.sectionNames).toEqual(["Passage 1"])
  })

  it("addEditor appends correct default name", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor() })
    expect(result.current.sectionNames).toEqual(["Passage 1", "Passage 2"])
    act(() => { result.current.addEditor() })
    expect(result.current.sectionNames).toEqual(["Passage 1", "Passage 2", "Passage 3"])
  })

  it("addEditor in quick succession assigns unique names", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor(); result.current.addEditor() })
    expect(result.current.sectionNames).toEqual(["Passage 1", "Passage 2", "Passage 3"])
  })

  it("removeEditor removes name at index", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor(); result.current.addEditor() })
    act(() => { result.current.updateSectionName(1, "Custom") })
    expect(result.current.sectionNames).toEqual(["Passage 1", "Custom", "Passage 3"])
    act(() => { result.current.removeEditor(1) })
    expect(result.current.sectionNames).toEqual(["Passage 1", "Passage 3"])
  })

  it("updateSectionName updates name at index", () => {
    const { result } = renderHook(() => useEditors())
    act(() => { result.current.addEditor() })
    act(() => { result.current.updateSectionName(0, "Intro") })
    expect(result.current.sectionNames).toEqual(["Intro", "Passage 2"])
    act(() => { result.current.updateSectionName(1, "Body") })
    expect(result.current.sectionNames).toEqual(["Intro", "Body"])
  })
})
