import { useState, useCallback, useMemo, useRef } from "react"
import { useSettings } from "./use-settings"
import { useLayers } from "./use-layers"
import { useEditors } from "./use-editors"
import { useActionHistory } from "./use-action-history"
import { useTrackedLayers } from "./use-tracked-layers"
import { useTrackedEditors } from "./use-tracked-editors"
import { useWebSocket } from "./use-websocket"
import type { Highlight, Arrow } from "@/types/editor"

export function useEditorWorkspace(workspaceId?: string | null) {
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

  // Debounce timer ref for editor content updates
  const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Wrap tracked layer actions to also send over WebSocket
  const addLayer = useCallback(
    (opts?: { id?: string; name?: string; color?: string }) => {
      const id = trackedLayersHook.addLayer(opts)
      const layer = rawLayersHook.layers.find((l) => l.id === id)
      // The layer may not be in state yet (setState is async), so derive from opts
      const name =
        opts?.name ??
        layer?.name ??
        `Layer ${rawLayersHook.layers.length + 1}`
      const color = opts?.color ?? layer?.color ?? ""
      sendAction("addLayer", { id, name, color })
      return id
    },
    [trackedLayersHook, rawLayersHook, sendAction]
  )

  const removeLayer = useCallback(
    (id: string) => {
      trackedLayersHook.removeLayer(id)
      sendAction("removeLayer", { id })
    },
    [trackedLayersHook, sendAction]
  )

  const updateLayerName = useCallback(
    (id: string, name: string) => {
      trackedLayersHook.updateLayerName(id, name)
      sendAction("updateLayerName", { id, name })
    },
    [trackedLayersHook, sendAction]
  )

  const updateLayerColor = useCallback(
    (id: string, color: string) => {
      trackedLayersHook.updateLayerColor(id, color)
      sendAction("updateLayerColor", { id, color })
    },
    [trackedLayersHook, sendAction]
  )

  const toggleLayerVisibility = useCallback(
    (id: string) => {
      trackedLayersHook.toggleLayerVisibility(id)
      sendAction("toggleLayerVisibility", { id })
    },
    [trackedLayersHook, sendAction]
  )

  const addHighlight = useCallback(
    (
      layerId: string,
      highlight: Omit<Highlight, "id">,
      opts?: { id?: string }
    ): string => {
      const id = trackedLayersHook.addHighlight(layerId, highlight, opts)
      sendAction("addHighlight", {
        layerId,
        highlight: { ...highlight, id },
      })
      return id
    },
    [trackedLayersHook, sendAction]
  )

  const removeHighlight = useCallback(
    (layerId: string, highlightId: string) => {
      trackedLayersHook.removeHighlight(layerId, highlightId)
      sendAction("removeHighlight", { layerId, highlightId })
    },
    [trackedLayersHook, sendAction]
  )

  const updateHighlightAnnotation = useCallback(
    (layerId: string, highlightId: string, annotation: string) => {
      trackedLayersHook.updateHighlightAnnotation(
        layerId,
        highlightId,
        annotation
      )
      sendAction("updateHighlightAnnotation", {
        layerId,
        highlightId,
        annotation,
      })
    },
    [trackedLayersHook, sendAction]
  )

  const addArrow = useCallback(
    (
      layerId: string,
      arrow: Omit<Arrow, "id">,
      opts?: { id?: string }
    ): string => {
      const id = trackedLayersHook.addArrow(layerId, arrow, opts)
      sendAction("addArrow", {
        layerId,
        arrow: { ...arrow, id },
      })
      return id
    },
    [trackedLayersHook, sendAction]
  )

  const removeArrow = useCallback(
    (layerId: string, arrowId: string) => {
      trackedLayersHook.removeArrow(layerId, arrowId)
      sendAction("removeArrow", { layerId, arrowId })
    },
    [trackedLayersHook, sendAction]
  )

  const addEditor = useCallback(() => {
    trackedEditorsHook.addEditor()
    const newIndex = rawEditorsHook.editorCount
    const name =
      rawEditorsHook.sectionNames[newIndex] ??
      `Passage ${rawEditorsHook.editorCount + 1}`
    sendAction("addEditor", { index: newIndex, name })
  }, [trackedEditorsHook, rawEditorsHook, sendAction])

  const removeEditor = useCallback(
    (index: number) => {
      trackedEditorsHook.removeEditor(index)
      sendAction("removeEditor", { index })
    },
    [trackedEditorsHook, sendAction]
  )

  const updateSectionName = useCallback(
    (index: number, name: string) => {
      rawEditorsHook.updateSectionName(index, name)
      sendAction("updateSectionName", { index, name })
    },
    [rawEditorsHook, sendAction]
  )

  const toggleSectionVisibility = useCallback(
    (index: number) => {
      rawEditorsHook.toggleSectionVisibility(index)
      sendAction("toggleSectionVisibility", { index })
    },
    [rawEditorsHook, sendAction]
  )

  const updateEditorContent = useCallback(
    (editorIndex: number, contentJson: unknown) => {
      if (contentTimerRef.current) {
        clearTimeout(contentTimerRef.current)
      }
      contentTimerRef.current = setTimeout(() => {
        sendAction("updateEditorContent", { editorIndex, contentJson })
        contentTimerRef.current = null
      }, 2000)
    },
    [sendAction]
  )

  const [isManagementPaneOpen, setIsManagementPaneOpen] = useState(true)

  const toggleManagementPane = useCallback(
    () => setIsManagementPaneOpen((v) => !v),
    []
  )

  return {
    ...settingsHook,
    // Spread remaining properties from tracked hooks (layers state, activeLayerId, etc.)
    layers: trackedLayersHook.layers,
    activeLayerId: trackedLayersHook.activeLayerId,
    setActiveLayer: trackedLayersHook.setActiveLayer,
    setActiveLayerId: trackedLayersHook.setActiveLayerId,
    setLayers: trackedLayersHook.setLayers,
    toggleAllLayerVisibility: trackedLayersHook.toggleAllLayerVisibility,
    clearLayerHighlights: trackedLayersHook.clearLayerHighlights,
    clearLayerArrows: trackedLayersHook.clearLayerArrows,
    // WS-wrapped layer actions
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
    // Editor state from tracked hook
    editorCount: trackedEditorsHook.editorCount,
    activeEditor: trackedEditorsHook.activeEditor,
    editorWidths: trackedEditorsHook.editorWidths,
    sectionVisibility: trackedEditorsHook.sectionVisibility,
    sectionNames: trackedEditorsHook.sectionNames,
    editorsRef: trackedEditorsHook.editorsRef,
    handleDividerResize: trackedEditorsHook.handleDividerResize,
    handleEditorMount: trackedEditorsHook.handleEditorMount,
    handlePaneFocus: trackedEditorsHook.handlePaneFocus,
    toggleAllSectionVisibility: trackedEditorsHook.toggleAllSectionVisibility,
    // WS-wrapped editor actions
    addEditor,
    removeEditor,
    updateSectionName,
    toggleSectionVisibility,
    updateEditorContent,
    // Other
    isManagementPaneOpen,
    toggleManagementPane,
    history,
    wsConnected,
  }
}
