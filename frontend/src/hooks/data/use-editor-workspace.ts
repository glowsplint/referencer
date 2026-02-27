// Central workspace hook that composes settings, layers, editors, action history,
// and Yjs CRDT collaboration into a single API. All data (text, annotations,
// layers) is synced via Yjs shared types through the collab server.
// All collaboration uses Yjs observe/transact.
import { useState, useCallback, useEffect, useRef } from "react";
import { useSettings } from "./use-settings";
import { useEditors } from "./use-editors";
import { useActionHistory } from "./use-action-history";
import { useTrackedEditors } from "./use-tracked-editors";
import { useYjs } from "./use-yjs";
import { useYjsLayers, buildEditorViewMap } from "./use-yjs-layers";
import { useYjsUndo } from "./use-yjs-undo";
import { useUnifiedUndo } from "./use-unified-undo";
import { useYjsOffline } from "./use-yjs-offline";
import { seedDefaultLayers } from "@/lib/yjs/annotations";
import {
  createDefaultLayers,
  DEFAULT_PASSAGE_CONTENTS,
  DEFAULT_SECTION_NAMES,
} from "@/data/default-workspace";
import type { Highlight, Arrow, LayerUnderline, ArrowStyle, CommentReply } from "@/types/editor";

export function useEditorWorkspace(workspaceId?: string | null, readOnly = false) {
  const settingsHook = useSettings();
  const rawEditorsHook = useEditors();
  const history = useActionHistory();

  const trackedEditorsHook = useTrackedEditors(rawEditorsHook, history);

  // Yjs provider for all CRDT collaboration (text + annotations)
  const yjs = useYjs(workspaceId ?? "default");

  // Yjs-backed layers for annotations (pass editorsRef for proper ProseMirror<->Yjs position mapping)
  const yjsLayers = useYjsLayers(yjs.doc, trackedEditorsHook.editorsRef);

  // Yjs undo/redo (replaces command-pattern history for CRDT operations)
  const yjsUndo = useYjsUndo(yjs.doc);

  // Unified undo/redo: Yjs first, then action history fallback
  const unifiedUndo = useUnifiedUndo(yjsUndo, history);

  // Offline persistence via IndexedDB
  const { idbSynced } = useYjsOffline(yjs.doc, workspaceId ?? "default");

  // True when both WebSocket (or connection-error fallback) AND IndexedDB have
  // finished loading. Seeding must wait for both to avoid overwriting persisted
  // data that hasn't been loaded yet (race between IDB async load and WS error).
  const readyForSeeding = yjs.synced && idbSynced;

  // Load demo content on demand (single-use)
  const demoLoadRequestedRef = useRef(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const loadDemoContent = useCallback(() => {
    if (readOnly || demoLoaded) return;
    const count = DEFAULT_SECTION_NAMES.length;
    // Set up editor panes
    rawEditorsHook.setEditorCount(count);
    rawEditorsHook.setSectionNames([...DEFAULT_SECTION_NAMES]);
    rawEditorsHook.setSectionVisibility(Array.from({ length: count }, () => true));
    rawEditorsHook.setSplitPositions(
      Array.from({ length: count - 1 }, (_, i) => ((i + 1) / count) * 100),
    );
    rawEditorsHook.setEditorKeys(Array.from({ length: count }, (_, i) => Date.now() + i));
    demoLoadRequestedRef.current = true;
    setDemoLoaded(true);
    setDemoLoading(true);
  }, [readOnly, demoLoaded, rawEditorsHook]);

  // After editors mount from a demo load request, set content and seed layers
  useEffect(() => {
    if (!demoLoadRequestedRef.current) return;
    if (!readyForSeeding) return;
    const allMounted = rawEditorsHook.mountedEditorCount >= DEFAULT_SECTION_NAMES.length;
    if (!allMounted) return;
    demoLoadRequestedRef.current = false;
    // Set editor content
    for (let i = 0; i < DEFAULT_SECTION_NAMES.length; i++) {
      const editor = trackedEditorsHook.editorsRef.current.get(i);
      if (editor && DEFAULT_PASSAGE_CONTENTS[i]) {
        editor.commands.setContent(DEFAULT_PASSAGE_CONTENTS[i]);
      }
    }
    // Seed annotation layers
    if (!yjs.doc) return;
    try {
      const views = buildEditorViewMap(trackedEditorsHook.editorsRef);
      seedDefaultLayers(yjs.doc, createDefaultLayers(), views);
    } catch (err) {
      console.error("Failed to seed demo layers:", err);
    }
    setDemoLoading(false);
  }, [rawEditorsHook.mountedEditorCount, readyForSeeding, yjs.doc, trackedEditorsHook.editorsRef]);

  // Wraps mutation callbacks to no-op when in read-only mode
  function guarded<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn,
    fallback?: TReturn,
  ): (...args: TArgs) => TReturn {
    return (...args: TArgs) => (readOnly ? (fallback as TReturn) : fn(...args));
  }

  // Layer mutations — all write to Y.Doc directly
  //
  // Each useCallback below wraps its body with `guarded()`, which closes over
  // the `readOnly` flag defined above. ESLint sees `guarded` as a missing
  // dependency, but it is intentionally omitted: `guarded` is a pure wrapper
  // that only reads `readOnly`, which is already listed in the deps array.
  // Including `guarded` would defeat memoisation because it is re-created on
  // every render.

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addLayer = useCallback(
    guarded((opts?: { id?: string; name?: string; color?: string; extraColors?: string[] }) => {
      const result = yjsLayers.addLayer(opts);
      if (!result) return "";
      const { id, name } = result;
      const color = yjsLayers.layers.find((l) => l.id === id)?.color ?? opts?.color ?? "";
      history.logOnly("addLayer", `Created layer '${name}'`, [
        { label: "name", after: name },
        { label: "color", after: color },
      ]);
      return id;
    }, ""),
    [readOnly, yjsLayers, history],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removeLayer = useCallback(
    guarded((id: string) => {
      const layer = yjsLayers.layers.find((l) => l.id === id);
      yjsLayers.removeLayer(id);
      if (layer) {
        history.logOnly("removeLayer", `Deleted layer '${layer.name}'`, [
          { label: "name", before: layer.name },
          { label: "highlights", before: String(layer.highlights.length) },
          { label: "arrows", before: String(layer.arrows.length) },
        ]);
      }
    }),
    [readOnly, yjsLayers, history],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateLayerName = useCallback(
    guarded((id: string, name: string) => {
      yjsLayers.updateLayerName(id, name);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateLayerColor = useCallback(
    guarded((id: string, color: string) => {
      yjsLayers.updateLayerColor(id, color);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleLayerVisibility = useCallback(
    guarded((id: string) => {
      yjsLayers.toggleLayerVisibility(id);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addHighlight = useCallback(
    guarded(
      (
        layerId: string,
        highlight: Omit<Highlight, "id" | "visible">,
        opts?: { id?: string },
      ): string => {
        return yjsLayers.addHighlight(layerId, highlight, opts);
      },
      "",
    ),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removeHighlight = useCallback(
    guarded((layerId: string, highlightId: string) => {
      yjsLayers.removeHighlight(layerId, highlightId);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateHighlightAnnotation = useCallback(
    guarded((layerId: string, highlightId: string, annotation: string) => {
      yjsLayers.updateHighlightAnnotation(layerId, highlightId, annotation);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addArrow = useCallback(
    guarded(
      (layerId: string, arrow: Omit<Arrow, "id" | "visible">, opts?: { id?: string }): string => {
        return yjsLayers.addArrow(layerId, arrow, opts);
      },
      "",
    ),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removeArrow = useCallback(
    guarded((layerId: string, arrowId: string) => {
      yjsLayers.removeArrow(layerId, arrowId);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateArrowStyle = useCallback(
    guarded((layerId: string, arrowId: string, arrowStyle: ArrowStyle) => {
      yjsLayers.updateArrowStyle(layerId, arrowId, arrowStyle);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addUnderline = useCallback(
    guarded(
      (
        layerId: string,
        underline: Omit<LayerUnderline, "id" | "visible">,
        opts?: { id?: string },
      ): string => {
        return yjsLayers.addUnderline(layerId, underline, opts);
      },
      "",
    ),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removeUnderline = useCallback(
    guarded((layerId: string, underlineId: string) => {
      yjsLayers.removeUnderline(layerId, underlineId);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addReply = useCallback(
    guarded((layerId: string, highlightId: string, reply: CommentReply) => {
      yjsLayers.addReply(layerId, highlightId, reply);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removeReply = useCallback(
    guarded((layerId: string, highlightId: string, replyId: string) => {
      yjsLayers.removeReply(layerId, highlightId, replyId);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleReactionOnHighlight = useCallback(
    guarded((layerId: string, highlightId: string, emoji: string, userName: string) => {
      yjsLayers.toggleReactionOnHighlight(layerId, highlightId, emoji, userName);
    }),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleReactionOnReply = useCallback(
    guarded(
      (layerId: string, highlightId: string, replyId: string, emoji: string, userName: string) => {
        yjsLayers.toggleReactionOnReply(layerId, highlightId, replyId, emoji, userName);
      },
    ),
    [readOnly, yjsLayers],
  );

  const toggleCommentPlacement = useCallback(() => {
    settingsHook.toggleCommentPlacement();
  }, [settingsHook]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addEditor = useCallback(
    guarded(() => {
      trackedEditorsHook.addEditor();
    }),
    [readOnly, trackedEditorsHook],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removeEditor = useCallback(
    guarded((index: number) => {
      trackedEditorsHook.removeEditor(index);
    }),
    [readOnly, trackedEditorsHook],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateSectionName = useCallback(
    guarded((index: number, name: string) => {
      trackedEditorsHook.updateSectionName(index, name);
    }),
    [readOnly, trackedEditorsHook],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reorderEditors = useCallback(
    guarded((permutation: number[]) => {
      rawEditorsHook.reorderEditors(permutation);
      history.record({
        type: "reorderEditors",
        description: "Reordered passages",
        undo: () => {
          if (rawEditorsHook.editorCount !== permutation.length) return;
          const inverse = new Array<number>(permutation.length);
          for (let newIdx = 0; newIdx < permutation.length; newIdx++) {
            inverse[permutation[newIdx]] = newIdx;
          }
          rawEditorsHook.reorderEditors(inverse);
        },
        redo: () => {
          if (rawEditorsHook.editorCount !== permutation.length) return;
          rawEditorsHook.reorderEditors(permutation);
        },
      });
    }),
    [readOnly, rawEditorsHook, history],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleSectionVisibility = useCallback(
    guarded((index: number) => {
      const wasVisible = rawEditorsHook.sectionVisibility[index] ?? true;
      const name = rawEditorsHook.sectionNames[index] ?? `Passage ${index + 1}`;
      rawEditorsHook.toggleSectionVisibility(index);
      history.record({
        type: wasVisible ? "hidePassage" : "showPassage",
        description: `${wasVisible ? "Hid" : "Showed"} passage '${name}'`,
        details: [{ label: "visible", before: String(wasVisible), after: String(!wasVisible) }],
        undo: () => rawEditorsHook.toggleSectionVisibility(index),
        redo: () => rawEditorsHook.toggleSectionVisibility(index),
      });
    }),
    [readOnly, rawEditorsHook, history],
  );

  const toggleLocked = useCallback(() => {
    const wasLocked = settingsHook.settings.isLocked;
    settingsHook.toggleLocked();
    history.record({
      type: wasLocked ? "unlock" : "lock",
      description: wasLocked ? "Unlocked editor" : "Locked editor",
      undo: () => settingsHook.toggleLocked(),
      redo: () => settingsHook.toggleLocked(),
    });
  }, [settingsHook, history]);

  const setActiveTool = useCallback(
    (tool: Parameters<typeof settingsHook.setActiveTool>[0]) => {
      if (tool === settingsHook.annotations.activeTool) return;
      const oldTool = settingsHook.annotations.activeTool;
      settingsHook.setActiveTool(tool);
      history.record({
        type: "setActiveTool",
        description: `Switched to ${tool} tool`,
        details: [{ label: "tool", before: oldTool, after: tool }],
        undo: () => settingsHook.setActiveTool(oldTool),
        redo: () => settingsHook.setActiveTool(tool),
      });
    },
    [settingsHook, history],
  );

  const toggleDarkMode = useCallback(() => {
    const wasDark = settingsHook.settings.isDarkMode;
    settingsHook.toggleDarkMode();
    history.record({
      type: "toggleDarkMode",
      description: `Switched to ${wasDark ? "light" : "dark"} mode`,
      details: [
        { label: "mode", before: wasDark ? "dark" : "light", after: wasDark ? "light" : "dark" },
      ],
      undo: () => settingsHook.toggleDarkMode(),
      redo: () => settingsHook.toggleDarkMode(),
    });
  }, [settingsHook, history]);

  const toggleMultipleRowsLayout = useCallback(() => {
    const wasRows = settingsHook.settings.isMultipleRowsLayout;
    settingsHook.toggleMultipleRowsLayout();
    history.record({
      type: "toggleLayout",
      description: `Switched to ${wasRows ? "column" : "row"} layout`,
      details: [
        { label: "layout", before: wasRows ? "row" : "column", after: wasRows ? "column" : "row" },
      ],
      undo: () => settingsHook.toggleMultipleRowsLayout(),
      redo: () => settingsHook.toggleMultipleRowsLayout(),
    });
  }, [settingsHook, history]);

  const [isManagementPaneOpen, setIsManagementPaneOpen] = useState(true);

  const toggleManagementPane = useCallback(() => setIsManagementPaneOpen((v) => !v), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleAllLayerVisibility = useCallback(
    guarded(() => yjsLayers.toggleAllLayerVisibility()),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clearLayerHighlights = useCallback(
    guarded((layerId: string) => yjsLayers.clearLayerHighlights(layerId)),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clearLayerArrows = useCallback(
    guarded((layerId: string) => yjsLayers.clearLayerArrows(layerId)),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clearLayerUnderlines = useCallback(
    guarded((layerId: string) => yjsLayers.clearLayerUnderlines(layerId)),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleHighlightVisibility = useCallback(
    guarded((layerId: string, highlightId: string) =>
      yjsLayers.toggleHighlightVisibility(layerId, highlightId),
    ),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleArrowVisibility = useCallback(
    guarded((layerId: string, arrowId: string) =>
      yjsLayers.toggleArrowVisibility(layerId, arrowId),
    ),
    [readOnly, yjsLayers],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleUnderlineVisibility = useCallback(
    guarded((layerId: string, underlineId: string) =>
      yjsLayers.toggleUnderlineVisibility(layerId, underlineId),
    ),
    [readOnly, yjsLayers],
  );

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
    toggleAllLayerVisibility,
    clearLayerHighlights,
    clearLayerArrows,
    clearLayerUnderlines,
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
    addReply,
    removeReply,
    toggleReactionOnHighlight,
    toggleReactionOnReply,
    toggleCommentPlacement,
    toggleThirdEditorFullWidth: settingsHook.toggleThirdEditorFullWidth,
    toggleHighlightVisibility,
    toggleArrowVisibility,
    toggleUnderlineVisibility,
    // Editors (still local state — not yet CRDT)
    editorCount: trackedEditorsHook.editorCount,
    activeEditor: trackedEditorsHook.activeEditor,
    editorWidths: trackedEditorsHook.editorWidths,
    sectionVisibility: trackedEditorsHook.sectionVisibility,
    sectionNames: trackedEditorsHook.sectionNames,
    editorKeys: trackedEditorsHook.editorKeys,
    editorsRef: trackedEditorsHook.editorsRef,
    columnSplit: trackedEditorsHook.columnSplit,
    rowSplit: trackedEditorsHook.rowSplit,
    handleColumnResize: trackedEditorsHook.handleColumnResize,
    handleRowResize: trackedEditorsHook.handleRowResize,
    handleDividerResize: trackedEditorsHook.handleDividerResize,
    handleEditorMount: trackedEditorsHook.handleEditorMount,
    handlePaneFocus: trackedEditorsHook.handlePaneFocus,
    toggleAllSectionVisibility: trackedEditorsHook.toggleAllSectionVisibility,
    addEditor,
    removeEditor,
    reorderEditors,
    updateSectionName,
    toggleSectionVisibility,
    loadDemoContent,
    demoLoaded,
    demoLoading,
    workspaceId: workspaceId ?? null,
    readOnly,
    isManagementPaneOpen,
    toggleManagementPane,
    history,
    wsConnected: yjs.connected,
    // Yjs CRDT collaboration
    yjs,
    // True when both WS + IndexedDB are synced (safe for content/layer seeding)
    readyForSeeding,
    // Unified undo/redo (Yjs + action history)
    unifiedUndo,
  };
}
