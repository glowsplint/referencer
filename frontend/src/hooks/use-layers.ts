import { useRef, useState, useCallback } from "react"
import type { Layer, Highlight, Arrow } from "@/types/editor"
import { TAILWIND_300_COLORS } from "@/types/editor"

export function useLayers() {
  const [layers, setLayers] = useState<Layer[]>([])
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const layerCounterRef = useRef(0)

  const updateLayer = (id: string, updater: (layer: Layer) => Layer) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? updater(l) : l)))
  }

  const addLayer = useCallback(() => {
    layerCounterRef.current += 1
    const nextNumber = layerCounterRef.current
    const id = crypto.randomUUID()
    setLayers((prev) => {
      const usedColors = new Set(prev.map((l) => l.color))
      const color = TAILWIND_300_COLORS.find((c) => !usedColors.has(c))
      if (!color) return prev
      const name = `Layer ${nextNumber}`
      setActiveLayerId(id)
      return [...prev, { id, name, color, visible: true, highlights: [], arrows: [] }]
    })
  }, [])

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
    setActiveLayerId((prev) => (prev === id ? null : prev))
  }, [])

  const setActiveLayer = useCallback((id: string) => {
    setActiveLayerId((prevId) => {
      if (prevId && prevId !== id) {
        setLayers((layers) =>
          layers.map((l) =>
            l.id === prevId
              ? { ...l, highlights: l.highlights.filter((h) => h.annotation.trim()) }
              : l
          )
        )
      }
      return id
    })
  }, [])

  const updateLayerColor = useCallback((id: string, color: string) => {
    updateLayer(id, (l) => ({ ...l, color }))
  }, [])

  const toggleLayerVisibility = useCallback((id: string) => {
    updateLayer(id, (l) => ({ ...l, visible: !l.visible }))
  }, [])

  const toggleAllLayerVisibility = useCallback(() => {
    setLayers((prev) => {
      const anyVisible = prev.some((l) => l.visible)
      return prev.map((l) => ({ ...l, visible: !anyVisible }))
    })
  }, [])

  const updateLayerName = useCallback((id: string, name: string) => {
    updateLayer(id, (l) => ({ ...l, name }))
  }, [])

  const addHighlight = useCallback(
    (layerId: string, highlight: Omit<Highlight, "id">): string => {
      const id = crypto.randomUUID()
      updateLayer(layerId, (l) => ({
        ...l,
        highlights: [...l.highlights, { ...highlight, id }],
      }))
      return id
    },
    []
  )

  const updateHighlightAnnotation = useCallback(
    (layerId: string, highlightId: string, annotation: string) => {
      updateLayer(layerId, (l) => ({
        ...l,
        highlights: l.highlights.map((h) =>
          h.id === highlightId ? { ...h, annotation } : h
        ),
      }))
    },
    []
  )

  const removeHighlight = useCallback((layerId: string, highlightId: string) => {
    updateLayer(layerId, (l) => ({
      ...l,
      highlights: l.highlights.filter((h) => h.id !== highlightId),
    }))
  }, [])

  const clearLayerHighlights = useCallback((layerId: string) => {
    updateLayer(layerId, (l) => ({ ...l, highlights: [] }))
  }, [])

  const addArrow = useCallback(
    (layerId: string, arrow: Omit<Arrow, "id">) => {
      updateLayer(layerId, (l) => ({
        ...l,
        arrows: [...l.arrows, { ...arrow, id: crypto.randomUUID() }],
      }))
    },
    []
  )

  const removeArrow = useCallback((layerId: string, arrowId: string) => {
    updateLayer(layerId, (l) => ({
      ...l,
      arrows: l.arrows.filter((a) => a.id !== arrowId),
    }))
  }, [])

  const clearLayerArrows = useCallback((layerId: string) => {
    updateLayer(layerId, (l) => ({ ...l, arrows: [] }))
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
    updateHighlightAnnotation,
    clearLayerHighlights,
    addArrow,
    removeArrow,
    clearLayerArrows,
  }
}
