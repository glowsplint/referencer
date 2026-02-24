// Composes the recording and playback hooks with the visibility snapshot
// applicator, providing a single RecordingContext value for the app.

import { useCallback, useMemo, useRef } from "react";
import { useRecordings } from "./use-recordings";
import { usePlayback } from "./use-playback";
import { setAnnotationVisibilityInDoc } from "@/lib/yjs/annotations";
import { parseVisibilityKey } from "@/lib/recording/visibility-keys";
import type { VisibilitySnapshot } from "@/types/recording";
import type { Layer } from "@/types/editor";
import type * as Y from "yjs";

interface UseRecordingManagerArgs {
  doc: Y.Doc | null;
  layers: Layer[];
  sectionVisibility: Record<number, boolean>;
  toggleLayerVisibility: (id: string) => void;
  toggleSectionVisibility: (index: number) => void;
}

export function useRecordingManager({
  doc,
  layers,
  sectionVisibility,
  toggleLayerVisibility,
  toggleSectionVisibility,
}: UseRecordingManagerArgs) {
  const recordingsHook = useRecordings(doc, layers, sectionVisibility);

  const layersRef = useRef(layers);
  layersRef.current = layers;
  const sectionVisibilityRef = useRef(sectionVisibility);
  sectionVisibilityRef.current = sectionVisibility;

  const applyVisibilitySnapshot = useCallback(
    (snapshot: VisibilitySnapshot) => {
      // Apply layer visibility
      for (const [layerId, visible] of Object.entries(snapshot.layers)) {
        const layer = layersRef.current.find((l) => l.id === layerId);
        if (layer && layer.visible !== visible) {
          toggleLayerVisibility(layerId);
        }
      }
      // Apply annotation visibility
      if (doc) {
        doc.transact(() => {
          for (const [key, visible] of Object.entries(snapshot.annotations)) {
            const { layerId, annotationId, yType } = parseVisibilityKey(key);
            setAnnotationVisibilityInDoc(doc, layerId, yType, annotationId, visible);
          }
        });
      }
      // Apply section visibility
      for (const [idxStr, visible] of Object.entries(snapshot.sections)) {
        const idx = Number(idxStr);
        const currentVisible = sectionVisibilityRef.current[idx] ?? true;
        if (currentVisible !== visible) {
          toggleSectionVisibility(idx);
        }
      }
    },
    [doc, toggleLayerVisibility, toggleSectionVisibility],
  );

  const playbackHook = usePlayback(recordingsHook.recordings, applyVisibilitySnapshot);

  return useMemo(
    () => ({ recordings: recordingsHook, playback: playbackHook }),
    [recordingsHook, playbackHook],
  );
}
