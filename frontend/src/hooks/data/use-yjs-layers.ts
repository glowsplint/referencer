// Yjs-backed layer state management. Replaces useLayers with CRDT-synced
// shared types. Reads layers from Y.Doc and re-renders on Yjs observe events.
// All mutations write directly to Y.Doc shared types.
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import i18n from "@/i18n";
import type * as Y from "yjs";
import type { Editor } from "@tiptap/react";
import type {
  Layer,
  Highlight,
  Arrow,
  LayerUnderline,
  ArrowStyle,
  CommentReply,
} from "@/types/editor";
import { TAILWIND_300_COLORS } from "@/constants/colors";
import {
  readLayers,
  getLayersArray,
  addLayerToDoc,
  removeLayerFromDoc,
  updateLayerNameInDoc,
  updateLayerColorInDoc,
  toggleLayerVisibilityInDoc,
  toggleAllLayerVisibilityInDoc,
  addHighlightToDoc,
  removeHighlightFromDoc,
  updateHighlightAnnotationInDoc,
  clearLayerHighlightsInDoc,
  addArrowToDoc,
  removeArrowFromDoc,
  updateArrowStyleInDoc,
  clearLayerArrowsInDoc,
  addUnderlineToDoc,
  removeUnderlineFromDoc,
  clearLayerUnderlinesInDoc,
  toggleHighlightVisibilityInDoc,
  toggleArrowVisibilityInDoc,
  toggleUnderlineVisibilityInDoc,
  addReplyToDoc,
  updateReplyInDoc,
  removeReplyFromDoc,
  toggleReactionOnHighlightInDoc,
  toggleReactionOnReplyInDoc,
  type EditorViewMap,
} from "@/lib/yjs/annotations";

/** Build a Map<number, EditorView> from the editorsRef for y-prosemirror position mapping */
function buildEditorViewMap(editorsRef: React.RefObject<Map<number, Editor>>): EditorViewMap {
  const map: EditorViewMap = new Map();
  if (!editorsRef.current) return map;
  for (const [index, editor] of editorsRef.current) {
    if (editor && !editor.isDestroyed && editor.view) {
      map.set(index, editor.view);
    }
  }
  return map;
}

export function useYjsLayers(doc: Y.Doc | null, editorsRef?: React.RefObject<Map<number, Editor>>) {
  const [layers, setLayersState] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const layerCounterRef = useRef(0);

  // Initialize layer counter from existing layers
  useEffect(() => {
    if (!doc) return;
    const yLayers = getLayersArray(doc);
    if (yLayers.length > 0) {
      layerCounterRef.current = yLayers.length;
    }
  }, [doc]);

  // Subscribe to Yjs changes and re-read layers
  useEffect(() => {
    if (!doc) return;

    const yLayers = getLayersArray(doc);

    const refresh = () => {
      const views = editorsRef ? buildEditorViewMap(editorsRef) : undefined;
      setLayersState(readLayers(doc, views));
    };

    // Deep observe to catch changes to nested maps/arrays
    yLayers.observeDeep(refresh);

    // Initial read
    refresh();

    return () => {
      yLayers.unobserveDeep(refresh);
    };
  }, [doc, editorsRef]);

  // Set active layer to first layer if none selected
  useEffect(() => {
    if (!activeLayerId && layers.length > 0) {
      setActiveLayerId(layers[0].id);
    }
  }, [layers, activeLayerId]);

  const addLayer = useCallback(
    (opts?: {
      id?: string;
      name?: string;
      color?: string;
      extraColors?: string[];
    }): { id: string; name: string } | null => {
      if (!doc) return null;
      const views = editorsRef ? buildEditorViewMap(editorsRef) : undefined;
      const currentLayers = readLayers(doc, views);
      const usedColors = new Set(currentLayers.map((l) => l.color));
      const allColors = opts?.extraColors
        ? [
            ...TAILWIND_300_COLORS,
            ...opts.extraColors.filter((c) => !TAILWIND_300_COLORS.includes(c)),
          ]
        : TAILWIND_300_COLORS;
      const color = opts?.color ?? allColors.find((c) => !usedColors.has(c));
      if (!color) {
        toast.warning(i18n.t("management:layers.allColorsInUse"));
        return null;
      }
      if (!opts?.name) {
        layerCounterRef.current += 1;
      }
      const id = opts?.id ?? crypto.randomUUID();
      const name = opts?.name ?? `Layer ${layerCounterRef.current}`;
      addLayerToDoc(doc, { id, name, color });
      setActiveLayerId(id);
      return { id, name };
    },
    [doc],
  );

  const removeLayer = useCallback(
    (id: string) => {
      if (!doc) return;
      removeLayerFromDoc(doc, id);
      setActiveLayerId((prev) => (prev === id ? null : prev));
    },
    [doc],
  );

  const setActiveLayer = useCallback((id: string) => {
    setActiveLayerId(id);
  }, []);

  const updateLayerColor = useCallback(
    (id: string, color: string) => {
      if (!doc) return;
      updateLayerColorInDoc(doc, id, color);
    },
    [doc],
  );

  const toggleLayerVisibility = useCallback(
    (id: string) => {
      if (!doc) return;
      toggleLayerVisibilityInDoc(doc, id);
    },
    [doc],
  );

  const toggleAllLayerVisibility = useCallback(() => {
    if (!doc) return;
    toggleAllLayerVisibilityInDoc(doc);
  }, [doc]);

  const updateLayerName = useCallback(
    (id: string, name: string) => {
      if (!doc) return;
      updateLayerNameInDoc(doc, id, name);
    },
    [doc],
  );

  const addHighlight = useCallback(
    (
      layerId: string,
      highlight: Omit<Highlight, "id" | "visible">,
      opts?: { id?: string },
    ): string => {
      if (!doc) return "";
      const id = opts?.id ?? crypto.randomUUID();
      const views = editorsRef ? buildEditorViewMap(editorsRef) : undefined;
      addHighlightToDoc(doc, layerId, highlight, id, views);
      return id;
    },
    [doc, editorsRef],
  );

  const updateHighlightAnnotation = useCallback(
    (layerId: string, highlightId: string, annotation: string) => {
      if (!doc) return;
      updateHighlightAnnotationInDoc(doc, layerId, highlightId, annotation);
    },
    [doc],
  );

  const removeHighlight = useCallback(
    (layerId: string, highlightId: string) => {
      if (!doc) return;
      removeHighlightFromDoc(doc, layerId, highlightId);
    },
    [doc],
  );

  const clearLayerHighlights = useCallback(
    (layerId: string) => {
      if (!doc) return;
      clearLayerHighlightsInDoc(doc, layerId);
    },
    [doc],
  );

  const addArrow = useCallback(
    (layerId: string, arrow: Omit<Arrow, "id" | "visible">, opts?: { id?: string }): string => {
      if (!doc) return "";
      const id = opts?.id ?? crypto.randomUUID();
      const views = editorsRef ? buildEditorViewMap(editorsRef) : undefined;
      addArrowToDoc(doc, layerId, arrow, id, views);
      return id;
    },
    [doc, editorsRef],
  );

  const removeArrow = useCallback(
    (layerId: string, arrowId: string) => {
      if (!doc) return;
      removeArrowFromDoc(doc, layerId, arrowId);
    },
    [doc],
  );

  const updateArrowStyle = useCallback(
    (layerId: string, arrowId: string, arrowStyle: ArrowStyle) => {
      if (!doc) return;
      updateArrowStyleInDoc(doc, layerId, arrowId, arrowStyle);
    },
    [doc],
  );

  const clearLayerArrows = useCallback(
    (layerId: string) => {
      if (!doc) return;
      clearLayerArrowsInDoc(doc, layerId);
    },
    [doc],
  );

  const addUnderline = useCallback(
    (
      layerId: string,
      underline: Omit<LayerUnderline, "id" | "visible">,
      opts?: { id?: string },
    ): string => {
      if (!doc) return "";
      const id = opts?.id ?? crypto.randomUUID();
      const views = editorsRef ? buildEditorViewMap(editorsRef) : undefined;
      addUnderlineToDoc(doc, layerId, underline, id, views);
      return id;
    },
    [doc, editorsRef],
  );

  const removeUnderline = useCallback(
    (layerId: string, underlineId: string) => {
      if (!doc) return;
      removeUnderlineFromDoc(doc, layerId, underlineId);
    },
    [doc],
  );

  const clearLayerUnderlines = useCallback(
    (layerId: string) => {
      if (!doc) return;
      clearLayerUnderlinesInDoc(doc, layerId);
    },
    [doc],
  );

  const toggleHighlightVisibility = useCallback(
    (layerId: string, highlightId: string) => {
      if (!doc) return;
      toggleHighlightVisibilityInDoc(doc, layerId, highlightId);
    },
    [doc],
  );

  const toggleArrowVisibility = useCallback(
    (layerId: string, arrowId: string) => {
      if (!doc) return;
      toggleArrowVisibilityInDoc(doc, layerId, arrowId);
    },
    [doc],
  );

  const toggleUnderlineVisibility = useCallback(
    (layerId: string, underlineId: string) => {
      if (!doc) return;
      toggleUnderlineVisibilityInDoc(doc, layerId, underlineId);
    },
    [doc],
  );

  const addReply = useCallback(
    (layerId: string, highlightId: string, reply: CommentReply) => {
      if (!doc) return;
      addReplyToDoc(doc, layerId, highlightId, reply);
    },
    [doc],
  );

  const updateReply = useCallback(
    (layerId: string, highlightId: string, replyId: string, text: string) => {
      if (!doc) return;
      updateReplyInDoc(doc, layerId, highlightId, replyId, text);
    },
    [doc],
  );

  const removeReply = useCallback(
    (layerId: string, highlightId: string, replyId: string) => {
      if (!doc) return;
      removeReplyFromDoc(doc, layerId, highlightId, replyId);
    },
    [doc],
  );

  const toggleReactionOnHighlight = useCallback(
    (layerId: string, highlightId: string, emoji: string, userName: string) => {
      if (!doc) return;
      toggleReactionOnHighlightInDoc(doc, layerId, highlightId, emoji, userName);
    },
    [doc],
  );

  const toggleReactionOnReply = useCallback(
    (layerId: string, highlightId: string, replyId: string, emoji: string, userName: string) => {
      if (!doc) return;
      toggleReactionOnReplyInDoc(doc, layerId, highlightId, replyId, emoji, userName);
    },
    [doc],
  );

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
    updateArrowStyle,
    clearLayerArrows,
    addUnderline,
    removeUnderline,
    clearLayerUnderlines,
    toggleHighlightVisibility,
    toggleArrowVisibility,
    toggleUnderlineVisibility,
    addReply,
    updateReply,
    removeReply,
    toggleReactionOnHighlight,
    toggleReactionOnReply,
    setActiveLayerId,
  };
}
