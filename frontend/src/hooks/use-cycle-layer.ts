import { useEffect, useRef } from "react";
import type { Layer } from "@/types/editor";
import { isEditableElement } from "@/lib/dom";

interface UseCycleLayerOptions {
  layers: Layer[];
  activeLayerId: string | null;
  setActiveLayer: (id: string) => void;
}

export function useCycleLayer({
  layers,
  activeLayerId,
  setActiveLayer,
}: UseCycleLayerOptions) {
  const layersRef = useRef(layers);
  const activeLayerIdRef = useRef(activeLayerId);
  const setActiveLayerRef = useRef(setActiveLayer);

  useEffect(() => {
    layersRef.current = layers;
    activeLayerIdRef.current = activeLayerId;
    setActiveLayerRef.current = setActiveLayer;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableElement(e.target)) return;

      const currentLayers = layersRef.current;
      if (currentLayers.length === 0) return;

      e.preventDefault();

      const currentId = activeLayerIdRef.current;
      const currentIndex = currentLayers.findIndex((l) => l.id === currentId);
      const direction = e.shiftKey ? -1 : 1;
      const nextIndex =
        ((currentIndex + direction) % currentLayers.length +
          currentLayers.length) %
        currentLayers.length;
      setActiveLayerRef.current(currentLayers[nextIndex].id);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
