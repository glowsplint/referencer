import { useCallback } from "react"
import type { useLayers } from "./use-layers"
import type { useActionHistory } from "./use-action-history"
import type { Highlight, Arrow } from "@/types/editor"

type LayersHook = ReturnType<typeof useLayers>
type History = ReturnType<typeof useActionHistory>

function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max) + "..." : text
}

export function useTrackedLayers(raw: LayersHook, history: History) {
  const { record } = history

  const addLayer = useCallback(
    (opts?: { id?: string; name?: string; color?: string }) => {
      const prevActiveLayerId = raw.activeLayerId
      const result = raw.addLayer(opts)
      if (!result) return ""
      const { id, name } = result
      record({
        type: "addLayer",
        description: `Created layer '${name}'`,
        undo: () => {
          raw.removeLayer(id)
          if (prevActiveLayerId) raw.setActiveLayerId(prevActiveLayerId)
          else raw.setActiveLayerId(null)
        },
        redo: () => {
          raw.addLayer({ ...opts, id, name })
        },
      })
      return id
    },
    [raw, record]
  )

  const removeLayer = useCallback(
    (id: string) => {
      const layer = raw.layers.find((l) => l.id === id)
      if (!layer) return
      const index = raw.layers.indexOf(layer)
      const snapshot = { ...layer }
      const prevActiveLayerId = raw.activeLayerId
      raw.removeLayer(id)
      record({
        type: "removeLayer",
        description: `Deleted layer '${snapshot.name}'`,
        undo: () => {
          raw.setLayers((prev) => {
            const copy = [...prev]
            copy.splice(index, 0, snapshot)
            return copy
          })
          if (prevActiveLayerId === id) raw.setActiveLayerId(id)
        },
        redo: () => {
          raw.removeLayer(id)
        },
      })
    },
    [raw, record]
  )

  const addHighlight = useCallback(
    (layerId: string, highlight: Omit<Highlight, "id">, opts?: { id?: string }): string => {
      const id = raw.addHighlight(layerId, highlight, opts)
      const text = highlight.text
      record({
        type: "addHighlight",
        description: `Highlighted '${truncate(text)}' in ${raw.layers.find((l) => l.id === layerId)?.name ?? "layer"}`,
        undo: () => {
          raw.removeHighlight(layerId, id)
        },
        redo: () => {
          raw.addHighlight(layerId, highlight, { id })
        },
      })
      return id
    },
    [raw, record]
  )

  const removeHighlight = useCallback(
    (layerId: string, highlightId: string) => {
      const layer = raw.layers.find((l) => l.id === layerId)
      const highlight = layer?.highlights.find((h) => h.id === highlightId)
      if (!highlight) {
        raw.removeHighlight(layerId, highlightId)
        return
      }
      const snapshot = { ...highlight }
      raw.removeHighlight(layerId, highlightId)
      record({
        type: "removeHighlight",
        description: `Removed highlight on '${truncate(snapshot.text)}' from ${layer?.name ?? "layer"}`,
        undo: () => {
          const { id, ...rest } = snapshot
          raw.addHighlight(layerId, rest, { id })
        },
        redo: () => {
          raw.removeHighlight(layerId, highlightId)
        },
      })
    },
    [raw, record]
  )

  const addArrow = useCallback(
    (layerId: string, arrow: Omit<Arrow, "id">, opts?: { id?: string }): string => {
      const id = raw.addArrow(layerId, arrow, opts)
      record({
        type: "addArrow",
        description: `Drew arrow from '${truncate(arrow.from.text)}' to '${truncate(arrow.to.text)}'`,
        undo: () => {
          raw.removeArrow(layerId, id)
        },
        redo: () => {
          raw.addArrow(layerId, arrow, { id })
        },
      })
      return id
    },
    [raw, record]
  )

  const removeArrow = useCallback(
    (layerId: string, arrowId: string) => {
      const layer = raw.layers.find((l) => l.id === layerId)
      const arrow = layer?.arrows.find((a) => a.id === arrowId)
      if (!arrow) {
        raw.removeArrow(layerId, arrowId)
        return
      }
      const snapshot = { ...arrow }
      raw.removeArrow(layerId, arrowId)
      record({
        type: "removeArrow",
        description: `Removed arrow from '${truncate(snapshot.from.text)}' to '${truncate(snapshot.to.text)}'`,
        undo: () => {
          const { id, ...rest } = snapshot
          raw.addArrow(layerId, rest, { id })
        },
        redo: () => {
          raw.removeArrow(layerId, arrowId)
        },
      })
    },
    [raw, record]
  )

  const updateLayerName = useCallback(
    (id: string, name: string) => {
      const layer = raw.layers.find((l) => l.id === id)
      const oldName = layer?.name ?? ""
      raw.updateLayerName(id, name)
      record({
        type: "updateLayerName",
        description: `Renamed layer '${oldName}' to '${name}'`,
        undo: () => {
          raw.updateLayerName(id, oldName)
        },
        redo: () => {
          raw.updateLayerName(id, name)
        },
      })
    },
    [raw, record]
  )

  const updateLayerColor = useCallback(
    (id: string, color: string) => {
      const layer = raw.layers.find((l) => l.id === id)
      const oldColor = layer?.color ?? ""
      raw.updateLayerColor(id, color)
      record({
        type: "updateLayerColor",
        description: `Changed '${layer?.name ?? "layer"}' color from ${oldColor} to ${color}`,
        undo: () => {
          raw.updateLayerColor(id, oldColor)
        },
        redo: () => {
          raw.updateLayerColor(id, color)
        },
      })
    },
    [raw, record]
  )

  const toggleAllLayerVisibility = useCallback(() => {
    const anyVisible = raw.layers.some((l) => l.visible)
    raw.toggleAllLayerVisibility()
    record({
      type: anyVisible ? "hideAllLayers" : "showAllLayers",
      description: anyVisible ? "Hid all layers" : "Showed all layers",
      undo: () => raw.toggleAllLayerVisibility(),
      redo: () => raw.toggleAllLayerVisibility(),
    })
  }, [raw, record])

  const clearLayerHighlights = useCallback(
    (layerId: string) => {
      const layer = raw.layers.find((l) => l.id === layerId)
      if (!layer || layer.highlights.length === 0) return
      const snapshot = [...layer.highlights]
      raw.clearLayerHighlights(layerId)
      record({
        type: "clearHighlights",
        description: `Cleared ${snapshot.length} highlight${snapshot.length === 1 ? "" : "s"} from '${layer.name}'`,
        undo: () => {
          for (const h of snapshot) {
            const { id, ...rest } = h
            raw.addHighlight(layerId, rest, { id })
          }
        },
        redo: () => {
          raw.clearLayerHighlights(layerId)
        },
      })
    },
    [raw, record]
  )

  const clearLayerArrows = useCallback(
    (layerId: string) => {
      const layer = raw.layers.find((l) => l.id === layerId)
      if (!layer || layer.arrows.length === 0) return
      const snapshot = [...layer.arrows]
      raw.clearLayerArrows(layerId)
      record({
        type: "clearArrows",
        description: `Cleared ${snapshot.length} arrow${snapshot.length === 1 ? "" : "s"} from '${layer.name}'`,
        undo: () => {
          for (const a of snapshot) {
            const { id, ...rest } = a
            raw.addArrow(layerId, rest, { id })
          }
        },
        redo: () => {
          raw.clearLayerArrows(layerId)
        },
      })
    },
    [raw, record]
  )

  return {
    ...raw,
    addLayer,
    removeLayer,
    addHighlight,
    removeHighlight,
    addArrow,
    removeArrow,
    updateLayerName,
    updateLayerColor,
    toggleAllLayerVisibility,
    clearLayerHighlights,
    clearLayerArrows,
  }
}
