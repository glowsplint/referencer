import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useEditorWorkspace } from "./use-editor-workspace"
import { TAILWIND_300_COLORS } from "@/types/editor"

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
      showDrawingToasts: true,
    })
    expect(result.current.annotations).toEqual({ activeTool: "selection" })
    expect(result.current.layers).toEqual([])
    expect(result.current.editorCount).toBe(1)
    expect(result.current.activeEditor).toBeNull()
    expect(result.current.editorWidths).toEqual([100])
    expect(result.current.isManagementPaneOpen).toBe(true)
  })

  it("toggleDarkMode toggles isDarkMode", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(result.current.settings.isDarkMode).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(result.current.settings.isDarkMode).toBe(false)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("toggleLocked toggles isLocked", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.toggleLocked()
    })

    expect(result.current.settings.isLocked).toBe(true)
  })

  it("setActiveTool changes the active tool", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.setActiveTool("arrow")
    })

    expect(result.current.annotations.activeTool).toBe("arrow")

    act(() => {
      result.current.setActiveTool("selection")
    })

    expect(result.current.annotations.activeTool).toBe("selection")
  })

  it("addLayer adds a layer with the next colour in order and a default name", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    expect(result.current.layers).toHaveLength(1)
    expect(result.current.layers[0].id).toBeTruthy()
    expect(result.current.layers[0].color).toBe(TAILWIND_300_COLORS[0])
    expect(result.current.layers[0].name).toBe("Layer 1")
  })

  it("addLayer assigns colours and names sequentially", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
      result.current.addLayer()
      result.current.addLayer()
    })

    expect(result.current.layers).toHaveLength(3)
    expect(result.current.layers[0].color).toBe(TAILWIND_300_COLORS[0])
    expect(result.current.layers[1].color).toBe(TAILWIND_300_COLORS[1])
    expect(result.current.layers[2].color).toBe(TAILWIND_300_COLORS[2])
    expect(result.current.layers[0].name).toBe("Layer 1")
    expect(result.current.layers[1].name).toBe("Layer 2")
    expect(result.current.layers[2].name).toBe("Layer 3")
    const ids = result.current.layers.map((l) => l.id)
    expect(new Set(ids).size).toBe(3)
  })

  it("addLayer does not exceed the number of available colours", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      for (let i = 0; i < TAILWIND_300_COLORS.length + 5; i++) {
        result.current.addLayer()
      }
    })

    expect(result.current.layers).toHaveLength(TAILWIND_300_COLORS.length)
  })

  it("addLayer after removeLayer assigns a different colour from existing layers", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
      result.current.addLayer()
      result.current.addLayer()
    })

    const secondLayerId = result.current.layers[1].id
    const remainingColors = [
      result.current.layers[0].color,
      result.current.layers[2].color,
    ]

    act(() => {
      result.current.removeLayer(secondLayerId)
    })

    expect(result.current.layers).toHaveLength(2)

    act(() => {
      result.current.addLayer()
    })

    expect(result.current.layers).toHaveLength(3)
    const newLayer = result.current.layers[2]
    expect(remainingColors).not.toContain(newLayer.color)
  })

  it("addLayer reuses freed colours from removed layers", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    // Fill all colour slots
    act(() => {
      for (let i = 0; i < TAILWIND_300_COLORS.length; i++) {
        result.current.addLayer()
      }
    })

    expect(result.current.layers).toHaveLength(TAILWIND_300_COLORS.length)

    // Remove a layer — its colour becomes available again
    const removedColor = result.current.layers[3].color
    const removedId = result.current.layers[3].id

    act(() => {
      result.current.removeLayer(removedId)
    })

    expect(result.current.layers).toHaveLength(TAILWIND_300_COLORS.length - 1)

    // Adding a layer should reuse the freed colour
    act(() => {
      result.current.addLayer()
    })

    expect(result.current.layers).toHaveLength(TAILWIND_300_COLORS.length)
    const newLayer = result.current.layers[result.current.layers.length - 1]
    expect(newLayer.color).toBe(removedColor)
  })

  it("addLayer name counter never resets after removing layers", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
      result.current.addLayer()
    })

    const firstLayerId = result.current.layers[0].id

    act(() => {
      result.current.removeLayer(firstLayerId)
    })

    act(() => {
      result.current.addLayer()
    })

    // Should be "Layer 3", not "Layer 1" — counter never resets
    expect(result.current.layers[1].name).toBe("Layer 3")
  })

  it("updateLayerName changes a layer's name", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    const layerId = result.current.layers[0].id

    act(() => {
      result.current.updateLayerName(layerId, "My Custom Layer")
    })

    expect(result.current.layers[0].name).toBe("My Custom Layer")
    expect(result.current.layers[0].id).toBe(layerId)
  })

  it("updateLayerName with non-existent id does nothing", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    act(() => {
      result.current.updateLayerName("non-existent", "New Name")
    })

    expect(result.current.layers[0].name).toBe("Layer 1")
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

  it("toggleManagementPane toggles isManagementPaneOpen", () => {
    const { result } = renderHook(() => useEditorWorkspace())
    expect(result.current.isManagementPaneOpen).toBe(true)

    act(() => {
      result.current.toggleManagementPane()
    })
    expect(result.current.isManagementPaneOpen).toBe(false)

    act(() => {
      result.current.toggleManagementPane()
    })
    expect(result.current.isManagementPaneOpen).toBe(true)
  })

  it("removeLayer removes a layer by id", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
      result.current.addLayer()
    })

    const firstLayerId = result.current.layers[0].id

    act(() => {
      result.current.removeLayer(firstLayerId)
    })

    expect(result.current.layers).toHaveLength(1)
    expect(result.current.layers[0].id).not.toBe(firstLayerId)
  })

  it("removeLayer with non-existent id does nothing", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    act(() => {
      result.current.removeLayer("non-existent")
    })

    expect(result.current.layers).toHaveLength(1)
  })

  it("updateLayerColor changes a layer's colour", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    const layerId = result.current.layers[0].id
    const newColor = TAILWIND_300_COLORS[5]

    act(() => {
      result.current.updateLayerColor(layerId, newColor)
    })

    expect(result.current.layers[0].color).toBe(newColor)
    expect(result.current.layers[0].id).toBe(layerId)
  })

  it("removeEditor decrements editor count and redistributes widths", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addEditor()
      result.current.addEditor()
    })
    expect(result.current.editorCount).toBe(3)

    act(() => {
      result.current.removeEditor(1)
    })

    expect(result.current.editorCount).toBe(2)
    expect(result.current.editorWidths).toHaveLength(2)
    expect(result.current.editorWidths[0]).toBeCloseTo(50, 0)
    expect(result.current.editorWidths[1]).toBeCloseTo(50, 0)
  })

  it("removeEditor does not go below 1 editor", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.removeEditor(0)
    })

    expect(result.current.editorCount).toBe(1)
  })

  it("addLayer auto-activates the first layer", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    expect(result.current.activeLayerId).toBe(result.current.layers[0].id)
  })

  it("addLayer always sets the new layer as active", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    act(() => {
      result.current.addLayer()
    })

    const secondId = result.current.layers[1].id
    expect(result.current.activeLayerId).toBe(secondId)
  })

  it("activeLayerId is initially null", () => {
    const { result } = renderHook(() => useEditorWorkspace())
    expect(result.current.activeLayerId).toBeNull()
  })

  it("setActiveLayer sets the active layer", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    const layerId = result.current.layers[0].id

    act(() => {
      result.current.setActiveLayer(layerId)
    })

    expect(result.current.activeLayerId).toBe(layerId)
  })

  it("setActiveLayer switches between layers", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
      result.current.addLayer()
    })

    const firstId = result.current.layers[0].id
    const secondId = result.current.layers[1].id

    act(() => {
      result.current.setActiveLayer(firstId)
    })
    expect(result.current.activeLayerId).toBe(firstId)

    act(() => {
      result.current.setActiveLayer(secondId)
    })
    expect(result.current.activeLayerId).toBe(secondId)
  })

  it("removeLayer clears activeLayerId when the active layer is removed", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
      result.current.addLayer()
    })

    const firstId = result.current.layers[0].id

    act(() => {
      result.current.setActiveLayer(firstId)
    })
    expect(result.current.activeLayerId).toBe(firstId)

    act(() => {
      result.current.removeLayer(firstId)
    })
    expect(result.current.activeLayerId).toBeNull()
  })

  it("removeLayer keeps activeLayerId when a different layer is removed", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
      result.current.addLayer()
    })

    const firstId = result.current.layers[0].id
    const secondId = result.current.layers[1].id

    act(() => {
      result.current.setActiveLayer(firstId)
    })

    act(() => {
      result.current.removeLayer(secondId)
    })

    expect(result.current.activeLayerId).toBe(firstId)
  })

  it("addLayer initializes highlights as empty array", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    expect(result.current.layers[0].highlights).toEqual([])
  })

  it("addLayer initializes visible as true", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    expect(result.current.layers[0].visible).toBe(true)
  })

  it("toggleLayerVisibility toggles a layer's visibility", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    const layerId = result.current.layers[0].id
    expect(result.current.layers[0].visible).toBe(true)

    act(() => {
      result.current.toggleLayerVisibility(layerId)
    })

    expect(result.current.layers[0].visible).toBe(false)

    act(() => {
      result.current.toggleLayerVisibility(layerId)
    })

    expect(result.current.layers[0].visible).toBe(true)
  })

  it("addHighlight adds a highlight to the specified layer", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    const layerId = result.current.layers[0].id

    act(() => {
      result.current.addHighlight(layerId, {
        editorIndex: 0,
        from: 1,
        to: 5,
        text: "hello",
      })
    })

    expect(result.current.layers[0].highlights).toHaveLength(1)
    expect(result.current.layers[0].highlights[0].text).toBe("hello")
    expect(result.current.layers[0].highlights[0].from).toBe(1)
    expect(result.current.layers[0].highlights[0].to).toBe(5)
    expect(result.current.layers[0].highlights[0].editorIndex).toBe(0)
    expect(result.current.layers[0].highlights[0].id).toBeTruthy()
  })

  it("addHighlight does not affect other layers", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
      result.current.addLayer()
    })

    const firstId = result.current.layers[0].id

    act(() => {
      result.current.addHighlight(firstId, {
        editorIndex: 0,
        from: 1,
        to: 5,
        text: "hello",
      })
    })

    expect(result.current.layers[0].highlights).toHaveLength(1)
    expect(result.current.layers[1].highlights).toHaveLength(0)
  })

  it("removeHighlight removes a highlight by id", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    const layerId = result.current.layers[0].id

    act(() => {
      result.current.addHighlight(layerId, {
        editorIndex: 0,
        from: 1,
        to: 5,
        text: "hello",
      })
      result.current.addHighlight(layerId, {
        editorIndex: 0,
        from: 10,
        to: 15,
        text: "world",
      })
    })

    expect(result.current.layers[0].highlights).toHaveLength(2)

    const highlightId = result.current.layers[0].highlights[0].id

    act(() => {
      result.current.removeHighlight(layerId, highlightId)
    })

    expect(result.current.layers[0].highlights).toHaveLength(1)
    expect(result.current.layers[0].highlights[0].text).toBe("world")
  })

  it("clearLayerHighlights removes all highlights from a layer", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => {
      result.current.addLayer()
    })

    const layerId = result.current.layers[0].id

    act(() => {
      result.current.addHighlight(layerId, {
        editorIndex: 0,
        from: 1,
        to: 5,
        text: "hello",
      })
      result.current.addHighlight(layerId, {
        editorIndex: 0,
        from: 10,
        to: 15,
        text: "world",
      })
    })

    expect(result.current.layers[0].highlights).toHaveLength(2)

    act(() => {
      result.current.clearLayerHighlights(layerId)
    })

    expect(result.current.layers[0].highlights).toEqual([])
  })

  it("editorsRef is exposed", () => {
    const { result } = renderHook(() => useEditorWorkspace())
    expect(result.current.editorsRef).toBeDefined()
    expect(result.current.editorsRef.current).toBeInstanceOf(Map)
  })

  // --- Undo/redo naming stability ---

  it("undo/redo addLayer preserves the original layer name", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => { result.current.addLayer() })
    expect(result.current.layers[0].name).toBe("Layer 1")

    act(() => { result.current.history.undo() })
    expect(result.current.layers).toHaveLength(0)

    act(() => { result.current.history.redo() })
    expect(result.current.layers[0].name).toBe("Layer 1")
  })

  it("repeated undo/redo of addLayer does not increment layer name", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => { result.current.addLayer() })
    expect(result.current.layers[0].name).toBe("Layer 1")

    for (let i = 0; i < 5; i++) {
      act(() => { result.current.history.undo() })
      act(() => { result.current.history.redo() })
    }

    expect(result.current.layers[0].name).toBe("Layer 1")
  })

  it("undo/redo addLayer does not waste counter values for subsequent layers", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => { result.current.addLayer() })
    act(() => { result.current.history.undo() })
    act(() => { result.current.history.redo() })
    act(() => { result.current.addLayer() })

    expect(result.current.layers[0].name).toBe("Layer 1")
    expect(result.current.layers[1].name).toBe("Layer 2")
  })

  it("undo/redo addEditor preserves the original passage name", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => { result.current.addEditor() })
    expect(result.current.sectionNames).toEqual(["Passage 1", "Passage 2"])

    act(() => { result.current.history.undo() })
    expect(result.current.sectionNames).toEqual(["Passage 1"])

    act(() => { result.current.history.redo() })
    expect(result.current.sectionNames).toEqual(["Passage 1", "Passage 2"])
  })

  it("repeated undo/redo of addEditor does not increment passage name", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => { result.current.addEditor() })

    for (let i = 0; i < 5; i++) {
      act(() => { result.current.history.undo() })
      act(() => { result.current.history.redo() })
    }

    expect(result.current.sectionNames).toEqual(["Passage 1", "Passage 2"])
  })

  // --- Toggle actions are undoable (logOnly → record) ---

  it("toggleLayerVisibility is undoable", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id
    expect(result.current.layers[0].visible).toBe(true)

    act(() => { result.current.toggleLayerVisibility(layerId) })
    expect(result.current.layers[0].visible).toBe(false)
    expect(result.current.history.canUndo).toBe(true)

    act(() => { result.current.history.undo() })
    expect(result.current.layers[0].visible).toBe(true)

    act(() => { result.current.history.redo() })
    expect(result.current.layers[0].visible).toBe(false)
  })

  it("toggleSectionVisibility is undoable", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    expect(result.current.sectionVisibility[0]).toBe(true)

    act(() => { result.current.toggleSectionVisibility(0) })
    expect(result.current.sectionVisibility[0]).toBe(false)
    expect(result.current.history.canUndo).toBe(true)

    act(() => { result.current.history.undo() })
    expect(result.current.sectionVisibility[0]).toBe(true)

    act(() => { result.current.history.redo() })
    expect(result.current.sectionVisibility[0]).toBe(false)
  })

  it("toggleLocked is undoable", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    expect(result.current.settings.isLocked).toBe(false)

    act(() => { result.current.toggleLocked() })
    expect(result.current.settings.isLocked).toBe(true)
    expect(result.current.history.canUndo).toBe(true)

    act(() => { result.current.history.undo() })
    expect(result.current.settings.isLocked).toBe(false)

    act(() => { result.current.history.redo() })
    expect(result.current.settings.isLocked).toBe(true)
  })

  it("toggleDarkMode is undoable", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    expect(result.current.settings.isDarkMode).toBe(false)

    act(() => { result.current.toggleDarkMode() })
    expect(result.current.settings.isDarkMode).toBe(true)

    act(() => { result.current.history.undo() })
    expect(result.current.settings.isDarkMode).toBe(false)

    act(() => { result.current.history.redo() })
    expect(result.current.settings.isDarkMode).toBe(true)
  })

  it("toggleMultipleRowsLayout is undoable", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    expect(result.current.settings.isMultipleRowsLayout).toBe(false)

    act(() => { result.current.toggleMultipleRowsLayout() })
    expect(result.current.settings.isMultipleRowsLayout).toBe(true)

    act(() => { result.current.history.undo() })
    expect(result.current.settings.isMultipleRowsLayout).toBe(false)

    act(() => { result.current.history.redo() })
    expect(result.current.settings.isMultipleRowsLayout).toBe(true)
  })

  it("setActiveTool no-ops when setting the same tool", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    expect(result.current.annotations.activeTool).toBe("selection")

    act(() => { result.current.setActiveTool("selection") })

    expect(result.current.history.canUndo).toBe(false)
    expect(result.current.history.log).toHaveLength(0)
  })

  it("setActiveTool is undoable and restores old tool", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    expect(result.current.annotations.activeTool).toBe("selection")

    act(() => { result.current.setActiveTool("arrow") })
    expect(result.current.annotations.activeTool).toBe("arrow")
    expect(result.current.history.canUndo).toBe(true)

    act(() => { result.current.history.undo() })
    expect(result.current.annotations.activeTool).toBe("selection")

    act(() => { result.current.history.redo() })
    expect(result.current.annotations.activeTool).toBe("arrow")
  })

  it("setActiveTool undo chain across multiple tool switches", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => { result.current.setActiveTool("arrow") })
    act(() => { result.current.setActiveTool("comments") })

    expect(result.current.annotations.activeTool).toBe("comments")

    act(() => { result.current.history.undo() })
    expect(result.current.annotations.activeTool).toBe("arrow")

    act(() => { result.current.history.undo() })
    expect(result.current.annotations.activeTool).toBe("selection")
  })

  it("toggle actions use record() not logOnly()", () => {
    const { result } = renderHook(() => useEditorWorkspace())

    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id

    act(() => {
      result.current.toggleLocked()
      result.current.toggleDarkMode()
      result.current.toggleMultipleRowsLayout()
      result.current.toggleLayerVisibility(layerId)
      result.current.toggleSectionVisibility(0)
      result.current.setActiveTool("arrow")
    })

    // All should be on the undo stack (addLayer + 6 toggles = 7)
    const logEntries = result.current.history.log
    expect(logEntries.length).toBe(7)

    // Undo all 6 toggle actions
    for (let i = 0; i < 6; i++) {
      expect(result.current.history.canUndo).toBe(true)
      act(() => { result.current.history.undo() })
    }

    // Only addLayer should remain on the undo stack
    expect(result.current.history.canUndo).toBe(true)
    act(() => { result.current.history.undo() })
    expect(result.current.history.canUndo).toBe(false)
  })
})
