import { useEffect, useRef } from "react";
import type { Layer } from "@/types/editor";

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
  layersRef.current = layers;
  const activeLayerIdRef = useRef(activeLayerId);
  activeLayerIdRef.current = activeLayerId;
  const setActiveLayerRef = useRef(setActiveLayer);
  setActiveLayerRef.current = setActiveLayer;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyL" || e.repeat) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (
        e.target instanceof HTMLElement &&
        e.target.contentEditable === "true"
      )
        return;

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
