import { useRef, useState, useCallback } from "react"
import type { Layer, Highlight, Arrow } from "@/types/editor"
import { TAILWIND_300_COLORS } from "@/types/editor"

export function useLayers() {
  const [layers, setLayers] = useState<Layer[]>([])
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const layerCounterRef = useRef(0)

  const addLayer = useCallback(() => {
    layerCounterRef.current += 1
    const nextNumber = layerCounterRef.current
    const id = crypto.randomUUID()
    setLayers((prev) => {
      const usedColors = new Set(prev.map((l) => l.color))
      const color = TAILWIND_300_COLORS.find((c) => !usedColors.has(c))
      if (!color) return prev
      const name = `Layer ${nextNumber}`
      if (prev.length === 0) {
        setActiveLayerId(id)
      }
      return [...prev, { id, name, color, visible: true, highlights: [], arrows: [] }]
    })
  }, [])

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
    setActiveLayerId((prev) => (prev === id ? null : prev))
  }, [])

  const setActiveLayer = useCallback((id: string) => {
    setActiveLayerId(id)
  }, [])

  const updateLayerColor = useCallback((id: string, color: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, color } : l))
    )
  }, [])

  const toggleLayerVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    )
  }, [])

  const toggleAllLayerVisibility = useCallback(() => {
    setLayers((prev) => {
      const anyVisible = prev.some((l) => l.visible)
      return prev.map((l) => ({ ...l, visible: !anyVisible }))
    })
  }, [])

  const updateLayerName = useCallback((id: string, name: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name } : l))
    )
  }, [])

  const addHighlight = useCallback(
    (layerId: string, highlight: Omit<Highlight, "id">) => {
      setLayers((prev) =>
        prev.map((l) =>
          l.id === layerId
            ? { ...l, highlights: [...l.highlights, { ...highlight, id: crypto.randomUUID() }] }
            : l
        )
      )
    },
    []
  )

  const removeHighlight = useCallback((layerId: string, highlightId: string) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === layerId
          ? { ...l, highlights: l.highlights.filter((h) => h.id !== highlightId) }
          : l
      )
    )
  }, [])

  const clearLayerHighlights = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === layerId ? { ...l, highlights: [] } : l
      )
    )
  }, [])

  const addArrow = useCallback(
    (layerId: string, arrow: Omit<Arrow, "id">) => {
      setLayers((prev) =>
        prev.map((l) =>
          l.id === layerId
            ? { ...l, arrows: [...l.arrows, { ...arrow, id: crypto.randomUUID() }] }
            : l
        )
      )
    },
    []
  )

  const removeArrow = useCallback((layerId: string, arrowId: string) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === layerId
          ? { ...l, arrows: l.arrows.filter((a) => a.id !== arrowId) }
          : l
      )
    )
  }, [])

  const clearLayerArrows = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === layerId ? { ...l, arrows: [] } : l
      )
    )
  }, [])

  return {
    layers,
    activeLayerId,
    addLayer,
    removeLayer,
    setActiveLayer,
    updateLayerColor,
    toggleLayerVisibility,
    toggleAllLayerVisibility,
    updateLayerName,
    addHighlight,
    removeHighlight,
    clearLayerHighlights,
    addArrow,
    removeArrow,
    clearLayerArrows,
  }
}
