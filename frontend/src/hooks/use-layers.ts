// Core layer state management. Stores all layers with their highlights,
// arrows, and underlines. Provides CRUD operations for each annotation type.
// Auto-assigns colors from a predefined palette and warns when exhausted.
import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import i18n from "@/i18n";
import type { Layer, Highlight, Arrow, LayerUnderline, ArrowStyle } from "@/types/editor";
import { TAILWIND_300_COLORS } from "@/types/editor";
import { createDefaultLayers } from "@/data/default-workspace";

const initialDefaultLayers = createDefaultLayers();

export function useLayers() {
  const [layers, setLayers] = useState<Layer[]>(initialDefaultLayers);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(
    initialDefaultLayers[0]?.id ?? null,
  );
  const layerCounterRef = useRef(0);
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const updateLayer = (id: string, updater: (layer: Layer) => Layer) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? updater(l) : l)));
  };

  const addLayer = useCallback(
    (opts?: {
      id?: string;
      name?: string;
      color?: string;
      extraColors?: string[];
    }): { id: string; name: string } | null => {
      const usedColors = new Set(layersRef.current.map((l) => l.color));
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
      const nextNumber = layerCounterRef.current;
      const id = opts?.id ?? crypto.randomUUID();
      const name = opts?.name ?? `Layer ${nextNumber}`;
      const newLayer: Layer = {
        id,
        name,
        color,
        visible: true,
        highlights: [],
        arrows: [],
        underlines: [],
      };
      // Eagerly update ref so rapid addLayer calls within the same React batch
      // can see previously added layers (setState is async/batched)
      layersRef.current = [...layersRef.current, newLayer];
      setLayers((prev) => [...prev, newLayer]);
      setActiveLayerId(id);
      return { id, name };
    },
    [],
  );

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setActiveLayerId((prev) => (prev === id ? null : prev));
  }, []);

  const setActiveLayer = useCallback((id: string) => {
    setActiveLayerId((prevId) => {
      if (prevId && prevId !== id) {
        // Clean up empty comments on the previously active layer when switching,
        // since they were placeholders awaiting annotation input
        setLayers((layers) =>
          layers.map((l) =>
            l.id === prevId
              ? {
                  ...l,
                  highlights: l.highlights.filter(
                    (h) => h.type !== "comment" || h.annotation.trim(),
                  ),
                }
              : l,
          ),
        );
      }
      return id;
    });
  }, []);

  const updateLayerColor = useCallback((id: string, color: string) => {
    updateLayer(id, (l) => ({ ...l, color }));
  }, []);

  const toggleLayerVisibility = useCallback((id: string) => {
    updateLayer(id, (l) => ({ ...l, visible: !l.visible }));
  }, []);

  const toggleAllLayerVisibility = useCallback(() => {
    setLayers((prev) => {
      const anyVisible = prev.some((l) => l.visible);
      return prev.map((l) => ({ ...l, visible: !anyVisible }));
    });
  }, []);

  const updateLayerName = useCallback((id: string, name: string) => {
    updateLayer(id, (l) => ({ ...l, name }));
  }, []);

  const addHighlight = useCallback(
    (layerId: string, highlight: Omit<Highlight, "id">, opts?: { id?: string }): string => {
      const id = opts?.id ?? crypto.randomUUID();
      updateLayer(layerId, (l) => ({
        ...l,
        highlights: [...l.highlights, { ...highlight, id }],
      }));
      return id;
    },
    [],
  );

  const updateHighlightAnnotation = useCallback(
    (layerId: string, highlightId: string, annotation: string) => {
      updateLayer(layerId, (l) => ({
        ...l,
        highlights: l.highlights.map((h) => (h.id === highlightId ? { ...h, annotation } : h)),
      }));
    },
    [],
  );

  const removeHighlight = useCallback((layerId: string, highlightId: string) => {
    updateLayer(layerId, (l) => ({
      ...l,
      highlights: l.highlights.filter((h) => h.id !== highlightId),
    }));
  }, []);

  const clearLayerHighlights = useCallback((layerId: string) => {
    updateLayer(layerId, (l) => ({ ...l, highlights: [] }));
  }, []);

  const addArrow = useCallback(
    (layerId: string, arrow: Omit<Arrow, "id">, opts?: { id?: string }): string => {
      const id = opts?.id ?? crypto.randomUUID();
      updateLayer(layerId, (l) => ({
        ...l,
        arrows: [...l.arrows, { ...arrow, id }],
      }));
      return id;
    },
    [],
  );

  const removeArrow = useCallback((layerId: string, arrowId: string) => {
    updateLayer(layerId, (l) => ({
      ...l,
      arrows: l.arrows.filter((a) => a.id !== arrowId),
    }));
  }, []);

  const updateArrowStyle = useCallback(
    (layerId: string, arrowId: string, arrowStyle: ArrowStyle) => {
      updateLayer(layerId, (l) => ({
        ...l,
        arrows: l.arrows.map((a) => (a.id === arrowId ? { ...a, arrowStyle } : a)),
      }));
    },
    [],
  );

  const clearLayerArrows = useCallback((layerId: string) => {
    updateLayer(layerId, (l) => ({ ...l, arrows: [] }));
  }, []);

  const addUnderline = useCallback(
    (layerId: string, underline: Omit<LayerUnderline, "id">, opts?: { id?: string }): string => {
      const id = opts?.id ?? crypto.randomUUID();
      updateLayer(layerId, (l) => ({
        ...l,
        underlines: [...l.underlines, { ...underline, id }],
      }));
      return id;
    },
    [],
  );

  const removeUnderline = useCallback((layerId: string, underlineId: string) => {
    updateLayer(layerId, (l) => ({
      ...l,
      underlines: l.underlines.filter((u) => u.id !== underlineId),
    }));
  }, []);

  const clearLayerUnderlines = useCallback((layerId: string) => {
    updateLayer(layerId, (l) => ({ ...l, underlines: [] }));
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
