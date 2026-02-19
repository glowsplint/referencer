// Central workspace hook that composes settings, layers, editors, action history,
// and Yjs CRDT collaboration into a single API. All data (text, annotations,
// layers) is synced via Yjs shared types through the collab server.
// All collaboration uses Yjs observe/transact.
import { useState, useCallback, useEffect, useRef } from "react"
import { useSettings } from "./use-settings"
import { useEditors } from "./use-editors"
import { useActionHistory } from "./use-action-history"
import { useTrackedEditors } from "./use-tracked-editors"
import { useYjs } from "./use-yjs"
import { useYjsLayers } from "./use-yjs-layers"
import { useYjsUndo } from "./use-yjs-undo"
import { useUnifiedUndo } from "./use-unified-undo"
import { useYjsOffline } from "./use-yjs-offline"
import { seedDefaultLayers } from "@/lib/yjs/annotations"
import { createDefaultLayers } from "@/data/default-workspace"
import type { Highlight, Arrow, LayerUnderline, ArrowStyle } from "@/types/editor"

export function useEditorWorkspace(workspaceId?: string | null, readOnly = false) {
  const settingsHook = useSettings()
  const rawEditorsHook = useEditors()
  const history = useActionHistory()

  const trackedEditorsHook = useTrackedEditors(rawEditorsHook, history)

  // Yjs provider for all CRDT collaboration (text + annotations)
  const yjs = useYjs(workspaceId ?? "default")

  // Yjs-backed layers for annotations
  const yjsLayers = useYjsLayers(yjs.doc)

  // Yjs undo/redo (replaces command-pattern history for CRDT operations)
  const yjsUndo = useYjsUndo(yjs.doc)

  // Unified undo/redo: Yjs first, then action history fallback
  const unifiedUndo = useUnifiedUndo(yjsUndo, history)

  // Offline persistence via IndexedDB
  useYjsOffline(yjs.doc, workspaceId ?? "default")

  // Seed default layers when Y.Doc is ready and empty.
  // Wait for the Yjs provider to report synced (or connection failure)
  // before seeding so we don't overwrite layers already stored on the server.
  const seededRef = useRef(false)
  useEffect(() => {
    if (!yjs.doc || seededRef.current || !yjs.synced) return
    seededRef.current = true
    try {
      seedDefaultLayers(yjs.doc, createDefaultLayers())
    } catch (err) {
      console.error("Failed to seed default layers:", err)
    }
  }, [yjs.doc, yjs.synced])

  // Wraps mutation callbacks to no-op when in read-only mode
  function guarded<T extends (...args: any[]) => any>(fn: T, fallback?: ReturnType<T>): T {
    return ((...args: any[]) => readOnly ? fallback : fn(...args)) as T
  }

  // Layer mutations — all write to Y.Doc directly
  const addLayer = useCallback(
    guarded(
      (opts?: { id?: string; name?: string; color?: string; extraColors?: string[] }) => {
        const result = yjsLayers.addLayer(opts)
        return result?.id ?? ""
      },
      ""
    ),
    [readOnly, yjsLayers]
  )

  const removeLayer = useCallback(
    guarded((id: string) => {
      yjsLayers.removeLayer(id)
    }),
    [readOnly, yjsLayers]
  )

  const updateLayerName = useCallback(
    guarded((id: string, name: string) => {
      yjsLayers.updateLayerName(id, name)
    }),
    [readOnly, yjsLayers]
  )

  const updateLayerColor = useCallback(
    guarded((id: string, color: string) => {
      yjsLayers.updateLayerColor(id, color)
    }),
    [readOnly, yjsLayers]
  )

  const toggleLayerVisibility = useCallback(
    guarded((id: string) => {
      yjsLayers.toggleLayerVisibility(id)
    }),
    [readOnly, yjsLayers]
  )

  const addHighlight = useCallback(
    guarded(
      (layerId: string, highlight: Omit<Highlight, "id">, opts?: { id?: string }): string => {
        return yjsLayers.addHighlight(layerId, highlight, opts)
      },
      ""
    ),
    [readOnly, yjsLayers]
  )

  const removeHighlight = useCallback(
    guarded((layerId: string, highlightId: string) => {
      yjsLayers.removeHighlight(layerId, highlightId)
    }),
    [readOnly, yjsLayers]
  )

  const updateHighlightAnnotation = useCallback(
    guarded((layerId: string, highlightId: string, annotation: string) => {
      yjsLayers.updateHighlightAnnotation(layerId, highlightId, annotation)
    }),
    [readOnly, yjsLayers]
  )

  const addArrow = useCallback(
    guarded(
      (layerId: string, arrow: Omit<Arrow, "id">, opts?: { id?: string }): string => {
        return yjsLayers.addArrow(layerId, arrow, opts)
      },
      ""
    ),
    [readOnly, yjsLayers]
  )

  const removeArrow = useCallback(
    guarded((layerId: string, arrowId: string) => {
      yjsLayers.removeArrow(layerId, arrowId)
    }),
    [readOnly, yjsLayers]
  )

  const updateArrowStyle = useCallback(
    guarded((layerId: string, arrowId: string, arrowStyle: ArrowStyle) => {
      yjsLayers.updateArrowStyle(layerId, arrowId, arrowStyle)
    }),
    [readOnly, yjsLayers]
  )

  const addUnderline = useCallback(
    guarded(
      (layerId: string, underline: Omit<LayerUnderline, "id">, opts?: { id?: string }): string => {
        return yjsLayers.addUnderline(layerId, underline, opts)
      },
      ""
    ),
    [readOnly, yjsLayers]
  )

  const removeUnderline = useCallback(
    guarded((layerId: string, underlineId: string) => {
      yjsLayers.removeUnderline(layerId, underlineId)
    }),
    [readOnly, yjsLayers]
  )

  const addEditor = useCallback(
    guarded(() => {
      trackedEditorsHook.addEditor()
    }),
    [readOnly, trackedEditorsHook]
  )

  const removeEditor = useCallback(
    guarded((index: number) => {
      trackedEditorsHook.removeEditor(index)
    }),
    [readOnly, trackedEditorsHook]
  )

  const updateSectionName = useCallback(
    guarded((index: number, name: string) => {
      trackedEditorsHook.updateSectionName(index, name)
    }),
    [readOnly, trackedEditorsHook]
  )

  const reorderEditors = useCallback(
    guarded((permutation: number[]) => {
      rawEditorsHook.reorderEditors(permutation)
      history.record({
        type: "reorderEditors",
        description: "Reordered passages",
        undo: () => {
          const inverse = new Array<number>(permutation.length)
          for (let newIdx = 0; newIdx < permutation.length; newIdx++) {
            inverse[permutation[newIdx]] = newIdx
          }
          rawEditorsHook.reorderEditors(inverse)
        },
        redo: () => {
          rawEditorsHook.reorderEditors(permutation)
        },
      })
    }),
    [readOnly, rawEditorsHook, history]
  )

  const toggleSectionVisibility = useCallback(
    guarded((index: number) => {
      const wasVisible = rawEditorsHook.sectionVisibility[index] ?? true
      const name = rawEditorsHook.sectionNames[index] ?? `Passage ${index + 1}`
      rawEditorsHook.toggleSectionVisibility(index)
      history.record({
        type: wasVisible ? "hidePassage" : "showPassage",
        description: `${wasVisible ? "Hid" : "Showed"} passage '${name}'`,
        details: [{ label: "visible", before: String(wasVisible), after: String(!wasVisible) }],
        undo: () => rawEditorsHook.toggleSectionVisibility(index),
        redo: () => rawEditorsHook.toggleSectionVisibility(index),
      })
    }),
    [readOnly, rawEditorsHook, history]
  )

  // No-op: text content is synced via Yjs Collaboration extension
  const updateEditorContent = useCallback(
    guarded((_editorIndex: number, _contentJson: unknown) => {}),
    [readOnly]
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
    // Layers from Yjs CRDT
    layers: yjsLayers.layers,
    activeLayerId: yjsLayers.activeLayerId,
    setActiveLayer: yjsLayers.setActiveLayer,
    setActiveLayerId: yjsLayers.setActiveLayerId,
    setLayers: yjsLayers.setLayers,
    toggleAllLayerVisibility: guarded(() => yjsLayers.toggleAllLayerVisibility()),
    clearLayerHighlights: guarded((layerId: string) => yjsLayers.clearLayerHighlights(layerId)),
    clearLayerArrows: guarded((layerId: string) => yjsLayers.clearLayerArrows(layerId)),
    clearLayerUnderlines: guarded((layerId: string) => yjsLayers.clearLayerUnderlines(layerId)),
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
    // Editors (still local state — not yet CRDT)
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
    wsConnected: yjs.connected,
    // Yjs CRDT collaboration
    yjs,
    // Unified undo/redo (Yjs + action history)
    unifiedUndo,
  }
}
