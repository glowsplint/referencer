import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useLayers } from "./use-layers"
import { TAILWIND_300_COLORS } from "@/types/editor"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useLayers", () => {
  it("returns initial state", () => {
    const { result } = renderHook(() => useLayers())
    expect(result.current.layers).toEqual([])
    expect(result.current.activeLayerId).toBeNull()
  })

  it("addLayer adds a layer with first available colour", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })

    expect(result.current.layers).toHaveLength(1)
    expect(result.current.layers[0].color).toBe(TAILWIND_300_COLORS[0])
    expect(result.current.layers[0].name).toBe("Layer 1")
    expect(result.current.layers[0].visible).toBe(true)
    expect(result.current.layers[0].highlights).toEqual([])
  })

  it("addLayer auto-activates the first layer", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    expect(result.current.activeLayerId).toBe(result.current.layers[0].id)
  })

  it("addLayer always sets the new layer as active", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    act(() => { result.current.addLayer() })
    const secondId = result.current.layers[1].id
    expect(result.current.activeLayerId).toBe(secondId)
  })

  it("addLayer does not exceed the number of available colours", () => {
    const { result } = renderHook(() => useLayers())

    act(() => {
      for (let i = 0; i < TAILWIND_300_COLORS.length + 3; i++) {
        result.current.addLayer()
      }
    })

    expect(result.current.layers).toHaveLength(TAILWIND_300_COLORS.length)
  })

  it("removeLayer removes a layer by id", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer(); result.current.addLayer() })
    const firstId = result.current.layers[0].id
    act(() => { result.current.removeLayer(firstId) })

    expect(result.current.layers).toHaveLength(1)
    expect(result.current.layers[0].id).not.toBe(firstId)
  })

  it("removeLayer clears activeLayerId when the active layer is removed", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const id = result.current.layers[0].id
    act(() => { result.current.removeLayer(id) })
    expect(result.current.activeLayerId).toBeNull()
  })

  it("removeLayer keeps activeLayerId when a different layer is removed", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer(); result.current.addLayer() })
    const firstId = result.current.layers[0].id
    const secondId = result.current.layers[1].id
    act(() => { result.current.setActiveLayer(firstId) })
    act(() => { result.current.removeLayer(secondId) })
    expect(result.current.activeLayerId).toBe(firstId)
  })

  it("removeLayer with non-existent id does nothing", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    act(() => { result.current.removeLayer("non-existent") })
    expect(result.current.layers).toHaveLength(1)
  })

  it("setActiveLayer sets the active layer", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer(); result.current.addLayer() })
    const secondId = result.current.layers[1].id
    act(() => { result.current.setActiveLayer(secondId) })
    expect(result.current.activeLayerId).toBe(secondId)
  })

  it("updateLayerColor changes a layer's colour", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const id = result.current.layers[0].id
    act(() => { result.current.updateLayerColor(id, "#000000") })
    expect(result.current.layers[0].color).toBe("#000000")
  })

  it("updateLayerColor with non-existent id does nothing", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const original = result.current.layers[0].color
    act(() => { result.current.updateLayerColor("non-existent", "#000000") })
    expect(result.current.layers[0].color).toBe(original)
  })

  it("toggleLayerVisibility toggles a layer's visibility", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const id = result.current.layers[0].id

    act(() => { result.current.toggleLayerVisibility(id) })
    expect(result.current.layers[0].visible).toBe(false)

    act(() => { result.current.toggleLayerVisibility(id) })
    expect(result.current.layers[0].visible).toBe(true)
  })

  it("toggleLayerVisibility with non-existent id does nothing", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    act(() => { result.current.toggleLayerVisibility("non-existent") })
    expect(result.current.layers[0].visible).toBe(true)
  })

  it("updateLayerName changes a layer's name", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const id = result.current.layers[0].id
    act(() => { result.current.updateLayerName(id, "Custom") })
    expect(result.current.layers[0].name).toBe("Custom")
  })

  it("updateLayerName with non-existent id does nothing", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    act(() => { result.current.updateLayerName("non-existent", "Nope") })
    expect(result.current.layers[0].name).toBe("Layer 1")
  })

  it("addHighlight adds a highlight to the specified layer", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const id = result.current.layers[0].id
    act(() => {
      result.current.addHighlight(id, { editorIndex: 0, from: 1, to: 5, text: "hello" })
    })

    expect(result.current.layers[0].highlights).toHaveLength(1)
    expect(result.current.layers[0].highlights[0].text).toBe("hello")
    expect(result.current.layers[0].highlights[0].id).toBeTruthy()
  })

  it("addHighlight does not affect other layers", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer(); result.current.addLayer() })
    const firstId = result.current.layers[0].id
    act(() => {
      result.current.addHighlight(firstId, { editorIndex: 0, from: 1, to: 5, text: "hello" })
    })

    expect(result.current.layers[0].highlights).toHaveLength(1)
    expect(result.current.layers[1].highlights).toHaveLength(0)
  })

  it("addHighlight to non-existent layer does nothing", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    act(() => {
      result.current.addHighlight("non-existent", { editorIndex: 0, from: 1, to: 5, text: "hello" })
    })
    expect(result.current.layers[0].highlights).toHaveLength(0)
  })

  it("removeHighlight removes a highlight by id", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id
    act(() => {
      result.current.addHighlight(layerId, { editorIndex: 0, from: 1, to: 5, text: "hello" })
      result.current.addHighlight(layerId, { editorIndex: 0, from: 10, to: 15, text: "world" })
    })

    const highlightId = result.current.layers[0].highlights[0].id
    act(() => { result.current.removeHighlight(layerId, highlightId) })

    expect(result.current.layers[0].highlights).toHaveLength(1)
    expect(result.current.layers[0].highlights[0].text).toBe("world")
  })

  it("removeHighlight with non-existent highlight id does nothing", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id
    act(() => {
      result.current.addHighlight(layerId, { editorIndex: 0, from: 1, to: 5, text: "hello" })
    })
    act(() => { result.current.removeHighlight(layerId, "non-existent") })
    expect(result.current.layers[0].highlights).toHaveLength(1)
  })

  it("clearLayerHighlights removes all highlights from a layer", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id
    act(() => {
      result.current.addHighlight(layerId, { editorIndex: 0, from: 1, to: 5, text: "hello" })
      result.current.addHighlight(layerId, { editorIndex: 0, from: 10, to: 15, text: "world" })
    })
    act(() => { result.current.clearLayerHighlights(layerId) })

    expect(result.current.layers[0].highlights).toEqual([])
  })

  it("clearLayerHighlights on layer with no highlights is a no-op", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id
    act(() => { result.current.clearLayerHighlights(layerId) })
    expect(result.current.layers[0].highlights).toEqual([])
  })

  it("toggleAllLayerVisibility hides all layers when any are visible", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer(); result.current.addLayer() })
    act(() => { result.current.toggleLayerVisibility(result.current.layers[0].id) })
    // One visible, one hidden
    expect(result.current.layers[0].visible).toBe(false)
    expect(result.current.layers[1].visible).toBe(true)

    act(() => { result.current.toggleAllLayerVisibility() })
    expect(result.current.layers[0].visible).toBe(false)
    expect(result.current.layers[1].visible).toBe(false)
  })

  it("toggleAllLayerVisibility shows all layers when none are visible", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer(); result.current.addLayer() })
    act(() => {
      result.current.toggleLayerVisibility(result.current.layers[0].id)
      result.current.toggleLayerVisibility(result.current.layers[1].id)
    })
    expect(result.current.layers[0].visible).toBe(false)
    expect(result.current.layers[1].visible).toBe(false)

    act(() => { result.current.toggleAllLayerVisibility() })
    expect(result.current.layers[0].visible).toBe(true)
    expect(result.current.layers[1].visible).toBe(true)
  })

  it("toggleAllLayerVisibility is a no-op when there are no layers", () => {
    const { result } = renderHook(() => useLayers())
    act(() => { result.current.toggleAllLayerVisibility() })
    expect(result.current.layers).toEqual([])
  })

  it("addLayer reuses freed colours from removed layers", () => {
    const { result } = renderHook(() => useLayers())

    act(() => {
      for (let i = 0; i < TAILWIND_300_COLORS.length; i++) {
        result.current.addLayer()
      }
    })

    const removedColor = result.current.layers[3].color
    const removedId = result.current.layers[3].id

    act(() => { result.current.removeLayer(removedId) })
    act(() => { result.current.addLayer() })

    const newLayer = result.current.layers[result.current.layers.length - 1]
    expect(newLayer.color).toBe(removedColor)
  })

  it("layer name counter never resets after removing layers", () => {
    const { result } = renderHook(() => useLayers())

    act(() => { result.current.addLayer(); result.current.addLayer() })
    const firstId = result.current.layers[0].id
    act(() => { result.current.removeLayer(firstId) })
    act(() => { result.current.addLayer() })

    expect(result.current.layers[1].name).toBe("Layer 3")
  })

  it("addLayer initializes arrows as empty array", () => {
    const { result } = renderHook(() => useLayers())
    act(() => { result.current.addLayer() })
    expect(result.current.layers[0].arrows).toEqual([])
  })

  it("addArrow adds an arrow to the specified layer", () => {
    const { result } = renderHook(() => useLayers())
    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id

    act(() => {
      result.current.addArrow(layerId, {
        from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
        to: { editorIndex: 0, from: 10, to: 15, text: "world" },
      })
    })

    expect(result.current.layers[0].arrows).toHaveLength(1)
    expect(result.current.layers[0].arrows[0].from.text).toBe("hello")
    expect(result.current.layers[0].arrows[0].to.text).toBe("world")
    expect(result.current.layers[0].arrows[0].id).toBeTruthy()
  })

  it("addArrow does not affect other layers", () => {
    const { result } = renderHook(() => useLayers())
    act(() => { result.current.addLayer(); result.current.addLayer() })
    const firstId = result.current.layers[0].id

    act(() => {
      result.current.addArrow(firstId, {
        from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
        to: { editorIndex: 0, from: 10, to: 15, text: "world" },
      })
    })

    expect(result.current.layers[0].arrows).toHaveLength(1)
    expect(result.current.layers[1].arrows).toHaveLength(0)
  })

  it("removeArrow removes an arrow by id", () => {
    const { result } = renderHook(() => useLayers())
    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id

    act(() => {
      result.current.addArrow(layerId, {
        from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
        to: { editorIndex: 0, from: 10, to: 15, text: "world" },
      })
      result.current.addArrow(layerId, {
        from: { editorIndex: 0, from: 20, to: 25, text: "foo" },
        to: { editorIndex: 1, from: 1, to: 4, text: "bar" },
      })
    })

    const arrowId = result.current.layers[0].arrows[0].id
    act(() => { result.current.removeArrow(layerId, arrowId) })

    expect(result.current.layers[0].arrows).toHaveLength(1)
    expect(result.current.layers[0].arrows[0].from.text).toBe("foo")
  })

  it("removeArrow with non-existent id does nothing", () => {
    const { result } = renderHook(() => useLayers())
    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id

    act(() => {
      result.current.addArrow(layerId, {
        from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
        to: { editorIndex: 0, from: 10, to: 15, text: "world" },
      })
    })
    act(() => { result.current.removeArrow(layerId, "non-existent") })

    expect(result.current.layers[0].arrows).toHaveLength(1)
  })

  it("clearLayerArrows removes all arrows from a layer", () => {
    const { result } = renderHook(() => useLayers())
    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id

    act(() => {
      result.current.addArrow(layerId, {
        from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
        to: { editorIndex: 0, from: 10, to: 15, text: "world" },
      })
      result.current.addArrow(layerId, {
        from: { editorIndex: 0, from: 20, to: 25, text: "foo" },
        to: { editorIndex: 1, from: 1, to: 4, text: "bar" },
      })
    })
    act(() => { result.current.clearLayerArrows(layerId) })

    expect(result.current.layers[0].arrows).toEqual([])
  })

  it("clearLayerArrows on layer with no arrows is a no-op", () => {
    const { result } = renderHook(() => useLayers())
    act(() => { result.current.addLayer() })
    const layerId = result.current.layers[0].id
    act(() => { result.current.clearLayerArrows(layerId) })
    expect(result.current.layers[0].arrows).toEqual([])
  })
})
