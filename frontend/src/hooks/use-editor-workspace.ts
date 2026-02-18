// Central workspace hook that composes settings, layers, editors, action history,
// WebSocket sync, and Yjs collaboration into a single API. Wraps every mutation
// with read-only guards, WebSocket broadcasting, and undo/redo history recording.
// Text content is synced via Yjs CRDT; annotations still use action-based WebSocket.
import { useState, useCallback, useRef } from "react"
import { useSettings } from "./use-settings"
import { useLayers } from "./use-layers"
import { useEditors } from "./use-editors"
import { useActionHistory } from "./use-action-history"
import { useTrackedLayers } from "./use-tracked-layers"
import { useTrackedEditors } from "./use-tracked-editors"
import { useWebSocket } from "./use-websocket"
import { useYjs } from "./use-yjs"
import type { Highlight, Arrow, LayerUnderline, ArrowStyle } from "@/types/editor"

export function useEditorWorkspace(workspaceId?: string | null, readOnly = false) {
  const settingsHook = useSettings()
  const rawLayersHook = useLayers()
  const rawEditorsHook = useEditors()
  const history = useActionHistory()

  const trackedLayersHook = useTrackedLayers(rawLayersHook, history)
  const trackedEditorsHook = useTrackedEditors(rawEditorsHook, history)

  const { connected: wsConnected, sendAction } = useWebSocket(
    workspaceId ?? null,
    rawLayersHook,
    rawEditorsHook
  )

  // Yjs provider for CRDT-based text collaboration
  const yjs = useYjs(workspaceId ?? "default")

  // Debounce timer ref for editor content updates
  const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Wraps mutation callbacks to no-op when in read-only mode (shared workspaces)
  function guarded<T extends (...args: any[]) => any>(fn: T, fallback?: ReturnType<T>): T {
    return ((...args: any[]) => readOnly ? fallback : fn(...args)) as T
  }

  const guardedSendAction = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      if (!readOnly) sendAction(type, payload)
    },
    [readOnly, sendAction]
  )

  // Wrap tracked layer actions to also send over WebSocket
  const addLayer = useCallback(
    guarded(
      (opts?: { id?: string; name?: string; color?: string; extraColors?: string[] }) => {
        const id = trackedLayersHook.addLayer(opts)
        if (!id) return ""
        const layer = rawLayersHook.layers.find((l) => l.id === id)
        const name =
          opts?.name ??
          layer?.name ??
          `Layer ${rawLayersHook.layers.length + 1}`
        const color = opts?.color ?? layer?.color ?? ""
        guardedSendAction("addLayer", { id, name, color })
        return id
      },
      ""
    ),
    [readOnly, trackedLayersHook, rawLayersHook, guardedSendAction]
  )

  const removeLayer = useCallback(
    guarded((id: string) => {
      trackedLayersHook.removeLayer(id)
      guardedSendAction("removeLayer", { id })
    }),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const updateLayerName = useCallback(
    guarded((id: string, name: string) => {
      trackedLayersHook.updateLayerName(id, name)
      guardedSendAction("updateLayerName", { id, name })
    }),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const updateLayerColor = useCallback(
    guarded((id: string, color: string) => {
      trackedLayersHook.updateLayerColor(id, color)
      guardedSendAction("updateLayerColor", { id, color })
    }),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const toggleLayerVisibility = useCallback(
    guarded((id: string) => {
      const layer = rawLayersHook.layers.find((l) => l.id === id)
      const wasVisible = layer?.visible ?? true
      trackedLayersHook.toggleLayerVisibility(id)
      guardedSendAction("toggleLayerVisibility", { id })
      history.record({
        type: wasVisible ? "hideLayer" : "showLayer",
        description: `${wasVisible ? "Hid" : "Showed"} layer '${layer?.name ?? "layer"}'`,
        details: [{ label: "visible", before: String(wasVisible), after: String(!wasVisible) }],
        undo: () => rawLayersHook.toggleLayerVisibility(id),
        redo: () => rawLayersHook.toggleLayerVisibility(id),
      })
    }),
    [readOnly, trackedLayersHook, rawLayersHook, guardedSendAction, history]
  )

  const addHighlight = useCallback(
    guarded(
      (
        layerId: string,
        highlight: Omit<Highlight, "id">,
        opts?: { id?: string }
      ): string => {
        const id = trackedLayersHook.addHighlight(layerId, highlight, opts)
        guardedSendAction("addHighlight", {
          layerId,
          highlight: { ...highlight, id },
        })
        return id
      },
      ""
    ),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const removeHighlight = useCallback(
    guarded((layerId: string, highlightId: string) => {
      trackedLayersHook.removeHighlight(layerId, highlightId)
      guardedSendAction("removeHighlight", { layerId, highlightId })
    }),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const updateHighlightAnnotation = useCallback(
    guarded((layerId: string, highlightId: string, annotation: string) => {
      trackedLayersHook.updateHighlightAnnotation(
        layerId,
        highlightId,
        annotation
      )
      guardedSendAction("updateHighlightAnnotation", {
        layerId,
        highlightId,
        annotation,
      })
    }),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const addArrow = useCallback(
    guarded(
      (
        layerId: string,
        arrow: Omit<Arrow, "id">,
        opts?: { id?: string }
      ): string => {
        const id = trackedLayersHook.addArrow(layerId, arrow, opts)
        guardedSendAction("addArrow", {
          layerId,
          arrow: { ...arrow, id },
        })
        return id
      },
      ""
    ),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const removeArrow = useCallback(
    guarded((layerId: string, arrowId: string) => {
      trackedLayersHook.removeArrow(layerId, arrowId)
      guardedSendAction("removeArrow", { layerId, arrowId })
    }),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const updateArrowStyle = useCallback(
    guarded((layerId: string, arrowId: string, arrowStyle: ArrowStyle) => {
      trackedLayersHook.updateArrowStyle(layerId, arrowId, arrowStyle)
      guardedSendAction("updateArrowStyle", { layerId, arrowId, arrowStyle })
    }),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const addUnderline = useCallback(
    guarded(
      (
        layerId: string,
        underline: Omit<LayerUnderline, "id">,
        opts?: { id?: string }
      ): string => {
        const id = trackedLayersHook.addUnderline(layerId, underline, opts)
        guardedSendAction("addUnderline", {
          layerId,
          underline: { ...underline, id },
        })
        return id
      },
      ""
    ),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const removeUnderline = useCallback(
    guarded((layerId: string, underlineId: string) => {
      trackedLayersHook.removeUnderline(layerId, underlineId)
      guardedSendAction("removeUnderline", { layerId, underlineId })
    }),
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const addEditor = useCallback(
    guarded(() => {
      trackedEditorsHook.addEditor()
      const newIndex = rawEditorsHook.editorCount
      const name =
        rawEditorsHook.sectionNames[newIndex] ??
        `Passage ${rawEditorsHook.editorCount + 1}`
      guardedSendAction("addEditor", { index: newIndex, name })
    }),
    [readOnly, trackedEditorsHook, rawEditorsHook, guardedSendAction]
  )

  const removeEditor = useCallback(
    guarded((index: number) => {
      trackedEditorsHook.removeEditor(index)
      guardedSendAction("removeEditor", { index })
    }),
    [readOnly, trackedEditorsHook, guardedSendAction]
  )

  const updateSectionName = useCallback(
    guarded((index: number, name: string) => {
      trackedEditorsHook.updateSectionName(index, name)
      guardedSendAction("updateSectionName", { index, name })
    }),
    [readOnly, trackedEditorsHook, guardedSendAction]
  )

  const reorderEditors = useCallback(
    guarded((permutation: number[]) => {
      const indexMap = new Map<number, number>()
      for (let newIdx = 0; newIdx < permutation.length; newIdx++) {
        indexMap.set(permutation[newIdx], newIdx)
      }

      const inverse = new Array<number>(permutation.length)
      for (let newIdx = 0; newIdx < permutation.length; newIdx++) {
        inverse[permutation[newIdx]] = newIdx
      }

      const layersBefore = rawLayersHook.layers.map(l => ({ ...l }))

      rawEditorsHook.reorderEditors(permutation)

      rawLayersHook.setLayers(prev =>
        prev.map(layer => ({
          ...layer,
          highlights: layer.highlights.map(h => ({
            ...h,
            editorIndex: indexMap.get(h.editorIndex) ?? h.editorIndex,
          })),
          arrows: layer.arrows.map(a => ({
            ...a,
            from: { ...a.from, editorIndex: indexMap.get(a.from.editorIndex) ?? a.from.editorIndex },
            to: { ...a.to, editorIndex: indexMap.get(a.to.editorIndex) ?? a.to.editorIndex },
          })),
          underlines: layer.underlines.map(u => ({
            ...u,
            editorIndex: indexMap.get(u.editorIndex) ?? u.editorIndex,
          })),
        }))
      )

      guardedSendAction("reorderEditors", { permutation })

      history.record({
        type: "reorderEditors",
        description: "Reordered passages",
        undo: () => {
          rawEditorsHook.reorderEditors(inverse)
          rawLayersHook.setLayers(layersBefore)
        },
        redo: () => {
          rawEditorsHook.reorderEditors(permutation)
          rawLayersHook.setLayers(prev =>
            prev.map(layer => ({
              ...layer,
              highlights: layer.highlights.map(h => ({
                ...h,
                editorIndex: indexMap.get(h.editorIndex) ?? h.editorIndex,
              })),
              arrows: layer.arrows.map(a => ({
                ...a,
                from: { ...a.from, editorIndex: indexMap.get(a.from.editorIndex) ?? a.from.editorIndex },
                to: { ...a.to, editorIndex: indexMap.get(a.to.editorIndex) ?? a.to.editorIndex },
              })),
              underlines: layer.underlines.map(u => ({
                ...u,
                editorIndex: indexMap.get(u.editorIndex) ?? u.editorIndex,
              })),
            }))
          )
        },
      })
    }),
    [readOnly, rawEditorsHook, rawLayersHook, guardedSendAction, history]
  )

  const toggleSectionVisibility = useCallback(
    guarded((index: number) => {
      const wasVisible = rawEditorsHook.sectionVisibility[index] ?? true
      const name = rawEditorsHook.sectionNames[index] ?? `Passage ${index + 1}`
      rawEditorsHook.toggleSectionVisibility(index)
      guardedSendAction("toggleSectionVisibility", { index })
      history.record({
        type: wasVisible ? "hidePassage" : "showPassage",
        description: `${wasVisible ? "Hid" : "Showed"} passage '${name}'`,
        details: [{ label: "visible", before: String(wasVisible), after: String(!wasVisible) }],
        undo: () => rawEditorsHook.toggleSectionVisibility(index),
        redo: () => rawEditorsHook.toggleSectionVisibility(index),
      })
    }),
    [readOnly, rawEditorsHook, guardedSendAction, history]
  )

  // Text content is now synced via Yjs CRDT — this fallback is only used
  // when the collab server is unavailable
  const updateEditorContent = useCallback(
    guarded((editorIndex: number, contentJson: unknown) => {
      if (yjs.connected) return
      if (contentTimerRef.current) {
        clearTimeout(contentTimerRef.current)
      }
      contentTimerRef.current = setTimeout(() => {
        guardedSendAction("updateEditorContent", { editorIndex, contentJson: contentJson as Record<string, unknown> })
        contentTimerRef.current = null
      }, 2000)
    }),
    [readOnly, guardedSendAction, yjs.connected]
  )

  const toggleLocked = useCallback(() => {
    const wasLocked = settingsHook.settings.isLocked
    settingsHook.toggleLocked()
    history.record({
      type: wasLocked ? "unlock" : "lock",
      description: wasLocked ? "Unlocked editor" : "Locked editor",
      undo: () => settingsHook.toggleLocked(),
      redo: () => settingsHook.toggleLocked(),
    })
  }, [settingsHook, history])

  const setActiveTool = useCallback(
    (tool: Parameters<typeof settingsHook.setActiveTool>[0]) => {
      if (tool === settingsHook.annotations.activeTool) return
      const oldTool = settingsHook.annotations.activeTool
      settingsHook.setActiveTool(tool)
      history.record({
        type: "setActiveTool",
        description: `Switched to ${tool} tool`,
        details: [{ label: "tool", before: oldTool, after: tool }],
        undo: () => settingsHook.setActiveTool(oldTool),
        redo: () => settingsHook.setActiveTool(tool),
      })
    },
    [settingsHook, history]
  )

  const toggleDarkMode = useCallback(() => {
    const wasDark = settingsHook.settings.isDarkMode
    settingsHook.toggleDarkMode()
    history.record({
      type: "toggleDarkMode",
      description: `Switched to ${wasDark ? "light" : "dark"} mode`,
      details: [{ label: "mode", before: wasDark ? "dark" : "light", after: wasDark ? "light" : "dark" }],
      undo: () => settingsHook.toggleDarkMode(),
      redo: () => settingsHook.toggleDarkMode(),
    })
  }, [settingsHook, history])

  const toggleMultipleRowsLayout = useCallback(() => {
    const wasRows = settingsHook.settings.isMultipleRowsLayout
    settingsHook.toggleMultipleRowsLayout()
    history.record({
      type: "toggleLayout",
      description: `Switched to ${wasRows ? "column" : "row"} layout`,
      details: [{ label: "layout", before: wasRows ? "row" : "column", after: wasRows ? "column" : "row" }],
      undo: () => settingsHook.toggleMultipleRowsLayout(),
      redo: () => settingsHook.toggleMultipleRowsLayout(),
    })
  }, [settingsHook, history])

  const [isManagementPaneOpen, setIsManagementPaneOpen] = useState(true)

  const toggleManagementPane = useCallback(
    () => setIsManagementPaneOpen((v) => !v),
    []
  )

  return {
    ...settingsHook,
    toggleLocked,
    setActiveTool,
    toggleDarkMode,
    toggleMultipleRowsLayout,
    layers: trackedLayersHook.layers,
    activeLayerId: trackedLayersHook.activeLayerId,
    setActiveLayer: trackedLayersHook.setActiveLayer,
    setActiveLayerId: trackedLayersHook.setActiveLayerId,
    setLayers: trackedLayersHook.setLayers,
    toggleAllLayerVisibility: trackedLayersHook.toggleAllLayerVisibility,
    clearLayerHighlights: trackedLayersHook.clearLayerHighlights,
    clearLayerArrows: trackedLayersHook.clearLayerArrows,
    clearLayerUnderlines: trackedLayersHook.clearLayerUnderlines,
    addLayer,
    removeLayer,
    updateLayerName,
    updateLayerColor,
    toggleLayerVisibility,
    addHighlight,
    removeHighlight,
    updateHighlightAnnotation,
    addArrow,
    removeArrow,
    updateArrowStyle,
    addUnderline,
    removeUnderline,
    editorCount: trackedEditorsHook.editorCount,
    activeEditor: trackedEditorsHook.activeEditor,
    editorWidths: trackedEditorsHook.editorWidths,
    sectionVisibility: trackedEditorsHook.sectionVisibility,
    sectionNames: trackedEditorsHook.sectionNames,
    editorKeys: trackedEditorsHook.editorKeys,
    editorsRef: trackedEditorsHook.editorsRef,
    handleDividerResize: trackedEditorsHook.handleDividerResize,
    handleEditorMount: trackedEditorsHook.handleEditorMount,
    handlePaneFocus: trackedEditorsHook.handlePaneFocus,
    toggleAllSectionVisibility: trackedEditorsHook.toggleAllSectionVisibility,
    addEditor,
    removeEditor,
    reorderEditors,
    updateSectionName,
    toggleSectionVisibility,
    updateEditorContent,
    workspaceId: workspaceId ?? null,
    readOnly,
    isManagementPaneOpen,
    toggleManagementPane,
    history,
    wsConnected,
    // Yjs CRDT collaboration
    yjs,
  }
}
