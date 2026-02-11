import { useState, useCallback, useMemo, useRef } from "react"
import { useSettings } from "./use-settings"
import { useLayers } from "./use-layers"
import { useEditors } from "./use-editors"
import { useActionHistory } from "./use-action-history"
import { useTrackedLayers } from "./use-tracked-layers"
import { useTrackedEditors } from "./use-tracked-editors"
import { useWebSocket } from "./use-websocket"
import type { Highlight, Arrow } from "@/types/editor"

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

  // Debounce timer ref for editor content updates
  const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const guardedSendAction = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      if (!readOnly) sendAction(type, payload)
    },
    [readOnly, sendAction]
  )

  // Wrap tracked layer actions to also send over WebSocket
  const addLayer = useCallback(
    (opts?: { id?: string; name?: string; color?: string }) => {
      if (readOnly) return ""
      const id = trackedLayersHook.addLayer(opts)
      const layer = rawLayersHook.layers.find((l) => l.id === id)
      // The layer may not be in state yet (setState is async), so derive from opts
      const name =
        opts?.name ??
        layer?.name ??
        `Layer ${rawLayersHook.layers.length + 1}`
      const color = opts?.color ?? layer?.color ?? ""
      guardedSendAction("addLayer", { id, name, color })
      return id
    },
    [readOnly, trackedLayersHook, rawLayersHook, guardedSendAction]
  )

  const removeLayer = useCallback(
    (id: string) => {
      if (readOnly) return
      trackedLayersHook.removeLayer(id)
      guardedSendAction("removeLayer", { id })
    },
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const updateLayerName = useCallback(
    (id: string, name: string) => {
      if (readOnly) return
      trackedLayersHook.updateLayerName(id, name)
      guardedSendAction("updateLayerName", { id, name })
    },
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const updateLayerColor = useCallback(
    (id: string, color: string) => {
      if (readOnly) return
      trackedLayersHook.updateLayerColor(id, color)
      guardedSendAction("updateLayerColor", { id, color })
    },
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const toggleLayerVisibility = useCallback(
    (id: string) => {
      if (readOnly) return
      trackedLayersHook.toggleLayerVisibility(id)
      guardedSendAction("toggleLayerVisibility", { id })
    },
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const addHighlight = useCallback(
    (
      layerId: string,
      highlight: Omit<Highlight, "id">,
      opts?: { id?: string }
    ): string => {
      if (readOnly) return ""
      const id = trackedLayersHook.addHighlight(layerId, highlight, opts)
      guardedSendAction("addHighlight", {
        layerId,
        highlight: { ...highlight, id },
      })
      return id
    },
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const removeHighlight = useCallback(
    (layerId: string, highlightId: string) => {
      if (readOnly) return
      trackedLayersHook.removeHighlight(layerId, highlightId)
      guardedSendAction("removeHighlight", { layerId, highlightId })
    },
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const updateHighlightAnnotation = useCallback(
    (layerId: string, highlightId: string, annotation: string) => {
      if (readOnly) return
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
    },
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const addArrow = useCallback(
    (
      layerId: string,
      arrow: Omit<Arrow, "id">,
      opts?: { id?: string }
    ): string => {
      if (readOnly) return ""
      const id = trackedLayersHook.addArrow(layerId, arrow, opts)
      guardedSendAction("addArrow", {
        layerId,
        arrow: { ...arrow, id },
      })
      return id
    },
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const removeArrow = useCallback(
    (layerId: string, arrowId: string) => {
      if (readOnly) return
      trackedLayersHook.removeArrow(layerId, arrowId)
      guardedSendAction("removeArrow", { layerId, arrowId })
    },
    [readOnly, trackedLayersHook, guardedSendAction]
  )

  const addEditor = useCallback(() => {
    if (readOnly) return
    trackedEditorsHook.addEditor()
    const newIndex = rawEditorsHook.editorCount
    const name =
      rawEditorsHook.sectionNames[newIndex] ??
      `Passage ${rawEditorsHook.editorCount + 1}`
    guardedSendAction("addEditor", { index: newIndex, name })
  }, [readOnly, trackedEditorsHook, rawEditorsHook, guardedSendAction])

  const removeEditor = useCallback(
    (index: number) => {
      if (readOnly) return
      trackedEditorsHook.removeEditor(index)
      guardedSendAction("removeEditor", { index })
    },
    [readOnly, trackedEditorsHook, guardedSendAction]
  )

  const updateSectionName = useCallback(
    (index: number, name: string) => {
      if (readOnly) return
      rawEditorsHook.updateSectionName(index, name)
      guardedSendAction("updateSectionName", { index, name })
    },
    [readOnly, rawEditorsHook, guardedSendAction]
  )

  const toggleSectionVisibility = useCallback(
    (index: number) => {
      if (readOnly) return
      rawEditorsHook.toggleSectionVisibility(index)
      guardedSendAction("toggleSectionVisibility", { index })
    },
    [readOnly, rawEditorsHook, guardedSendAction]
  )

  const updateEditorContent = useCallback(
    (editorIndex: number, contentJson: unknown) => {
      if (readOnly) return
      if (contentTimerRef.current) {
        clearTimeout(contentTimerRef.current)
      }
      contentTimerRef.current = setTimeout(() => {
        guardedSendAction("updateEditorContent", { editorIndex, contentJson: contentJson as Record<string, unknown> })
        contentTimerRef.current = null
      }, 2000)
    },
    [readOnly, guardedSendAction]
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
    workspaceId: workspaceId ?? null,
    readOnly,
    isManagementPaneOpen,
    toggleManagementPane,
    history,
    wsConnected,
  }
}
