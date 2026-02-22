// Yjs-backed layer state management. Replaces useLayers with CRDT-synced
// shared types. Reads layers from Y.Doc and re-renders on Yjs observe events.
// All mutations write directly to Y.Doc shared types.
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import i18n from "@/i18n";
import type * as Y from "yjs";
import type { Editor } from "@tiptap/react";
import type { Layer, Highlight, Arrow, LayerUnderline, ArrowStyle } from "@/types/editor";
import { TAILWIND_300_COLORS } from "@/types/editor";
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

    // Also observe XmlFragments for position changes (text edits shift RelativePositions)
    // We listen to doc updates to catch text changes that affect position resolution
    const onUpdate = () => {
      const views = editorsRef ? buildEditorViewMap(editorsRef) : undefined;
      setLayersState(readLayers(doc, views));
    };
    doc.on("update", onUpdate);

    // Initial read
    refresh();

    return () => {
      yLayers.unobserveDeep(refresh);
      doc.off("update", onUpdate);
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
    (layerId: string, highlight: Omit<Highlight, "id">, opts?: { id?: string }): string => {
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
    (layerId: string, arrow: Omit<Arrow, "id">, opts?: { id?: string }): string => {
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
    (layerId: string, underline: Omit<LayerUnderline, "id">, opts?: { id?: string }): string => {
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

  // setLayers is provided for compatibility but is a no-op with Yjs
  // (all mutations go through the specific mutation functions above)
  const setLayers = useCallback((_updater: Layer[] | ((prev: Layer[]) => Layer[])) => {
    // No-op: Yjs is the source of truth. Direct setLayers is not supported
    // in CRDT mode. Use specific mutation functions instead.
    console.warn("[yjs-layers] setLayers called but ignored in CRDT mode");
  }, []);

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
    setLayers,
    setActiveLayerId,
  };
}
