import { useEffect, useRef } from "react";
import type { Layer } from "@/types/editor";
import { isEditableElement } from "@/lib/dom";

const CYCLE_LAYER_KEY = "KeyL";

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
      if (e.code !== CYCLE_LAYER_KEY || e.repeat) return;
      if (isEditableElement(e.target)) return;

      const currentLayers = layersRef.current;
      if (currentLayers.length === 0) return;

      e.preventDefault();

      const currentId = activeLayerIdRef.current;
      const currentIndex = currentLayers.findIndex((l) => l.id === currentId);
      const nextIndex = (currentIndex + 1) % currentLayers.length;
      setActiveLayerRef.current(currentLayers[nextIndex].id);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
