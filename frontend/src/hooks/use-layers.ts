import { useRef, useState, useCallback } from "react"
import { toast } from "sonner"
import type { Layer, Highlight, Arrow, ArrowStyle } from "@/types/editor"
import { TAILWIND_300_COLORS } from "@/types/editor"

export function useLayers() {
  const [layers, setLayers] = useState<Layer[]>([])
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const layerCounterRef = useRef(0)
  const layersRef = useRef(layers)
  layersRef.current = layers

  const updateLayer = (id: string, updater: (layer: Layer) => Layer) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? updater(l) : l)))
  }

  const addLayer = useCallback((opts?: { id?: string; name?: string; color?: string; extraColors?: string[] }): { id: string; name: string } | null => {
    const usedColors = new Set(layersRef.current.map((l) => l.color))
    const allColors = opts?.extraColors
      ? [...TAILWIND_300_COLORS, ...opts.extraColors.filter((c) => !TAILWIND_300_COLORS.includes(c))]
      : TAILWIND_300_COLORS
    const color = opts?.color ?? allColors.find((c) => !usedColors.has(c))
    if (!color) {
      toast.warning("All colors are in use — remove a layer first")
      return null
    }
    if (!opts?.name) {
      layerCounterRef.current += 1
    }
    const nextNumber = layerCounterRef.current
    const id = opts?.id ?? crypto.randomUUID()
    const name = opts?.name ?? `Layer ${nextNumber}`
    const newLayer: Layer = { id, name, color, visible: true, arrowStyle: "solid", highlights: [], arrows: [] }
    // Eagerly update ref so rapid calls within the same batch see the new layer
    layersRef.current = [...layersRef.current, newLayer]
    setLayers((prev) => [...prev, newLayer])
    setActiveLayerId(id)
    return { id, name }
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

  const updateLayerArrowStyle = useCallback((id: string, arrowStyle: ArrowStyle) => {
    updateLayer(id, (l) => ({ ...l, arrowStyle }))
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
    (layerId: string, highlight: Omit<Highlight, "id">, opts?: { id?: string }): string => {
      const id = opts?.id ?? crypto.randomUUID()
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
    (layerId: string, arrow: Omit<Arrow, "id">, opts?: { id?: string }): string => {
      const id = opts?.id ?? crypto.randomUUID()
      updateLayer(layerId, (l) => ({
        ...l,
        arrows: [...l.arrows, { ...arrow, id }],
      }))
      return id
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
    updateLayerArrowStyle,
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
    setLayers,
    setActiveLayerId,
  }
}
