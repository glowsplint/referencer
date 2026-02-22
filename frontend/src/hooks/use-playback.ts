// Playback hook for presenter mode. Manages stepping through a recording's
// visibility deltas, applying snapshots to the editor, and autoplay.

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  Recording,
  VisibilitySnapshot,
  VisibilityDelta,
} from "@/types/recording";

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

/** Apply a single delta to a snapshot, returning a new snapshot + warnings. */
export function applyDelta(
  snapshot: VisibilitySnapshot,
  delta: VisibilityDelta,
): { snapshot: VisibilitySnapshot; warnings: string[] } {
  const result: VisibilitySnapshot = {
    layers: { ...snapshot.layers },
    annotations: { ...snapshot.annotations },
    sections: { ...snapshot.sections },
  };
  const warnings: string[] = [];

  for (const [key, visible] of Object.entries(delta)) {
    if (key.startsWith("layer:")) {
      const layerId = key.slice("layer:".length);
      if (layerId in result.layers) {
        result.layers[layerId] = visible;
      } else {
        warnings.push(`Layer ${layerId} not found`);
      }
    } else if (key.startsWith("section:")) {
      const idx = Number(key.slice("section:".length));
      result.sections[idx] = visible;
    } else {
      // Annotation key, e.g. "highlight:layerId:id", "arrow:layerId:id", "underline:layerId:id"
      if (key in result.annotations) {
        result.annotations[key] = visible;
      } else {
        warnings.push(`Annotation ${key} not found`);
      }
    }
  }

  return { snapshot: result, warnings };
}

/**
 * Compute the visibility snapshot at a given step index.
 * stepIndex = -1 means the initial state (no deltas applied).
 * stepIndex = 0 means after applying step 0, etc.
 */
export function computeSnapshotAtStep(
  recording: Recording,
  stepIndex: number,
): { snapshot: VisibilitySnapshot; warnings: string[] } {
  let current = recording.initialState;
  const allWarnings: string[] = [];

  for (let i = 0; i <= stepIndex && i < recording.steps.length; i++) {
    const { snapshot, warnings } = applyDelta(current, recording.steps[i].delta);
    current = snapshot;
    allWarnings.push(...warnings);
  }

  return { snapshot: current, warnings: allWarnings };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePlayback(
  recordings: Recording[],
  applyVisibilitySnapshot: (snapshot: VisibilitySnapshot) => void,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [hasWarnings, setHasWarnings] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived ------------------------------------------------------------------
  const activeRecording = recordings.find((r) => r.id === activeRecordingId) ?? null;
  const totalSteps = activeRecording?.steps.length ?? 0;

  // Apply snapshot whenever step changes ----------------------------------------
  useEffect(() => {
    if (!isPlaying || !activeRecording) return;
    const { snapshot, warnings } = computeSnapshotAtStep(
      activeRecording,
      currentStepIndex,
    );
    setHasWarnings(warnings.length > 0);
    applyVisibilitySnapshot(snapshot);
  }, [isPlaying, activeRecording, currentStepIndex, applyVisibilitySnapshot]);

  // Autoplay timer ------------------------------------------------------------
  useEffect(() => {
    if (!isAutoPlaying || !activeRecording) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          // Reached the end -- stop autoplay
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, activeRecording.globalDelayMs);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [isAutoPlaying, activeRecording, totalSteps]);

  // Cleanup on unmount --------------------------------------------------------
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, []);

  // Actions -------------------------------------------------------------------

  const startPlayback = useCallback((recordingId: string) => {
    setActiveRecordingId(recordingId);
    setCurrentStepIndex(-1);
    setIsPlaying(true);
    setIsAutoPlaying(false);
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setIsAutoPlaying(false);
    setActiveRecordingId(null);
    setCurrentStepIndex(-1);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const previousStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, -1));
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      setCurrentStepIndex(Math.max(-1, Math.min(index, totalSteps - 1)));
    },
    [totalSteps],
  );

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
  }, []);

  // Current snapshot for external consumers -----------------------------------
  const currentSnapshot =
    isPlaying && activeRecording
      ? computeSnapshotAtStep(activeRecording, currentStepIndex).snapshot
      : null;

  return {
    isPlaying,
    isAutoPlaying,
    activeRecordingId,
    currentStepIndex,
    totalSteps,
    startPlayback,
    stopPlayback,
    nextStep,
    previousStep,
    goToStep,
    toggleAutoPlay,
    currentSnapshot,
    hasWarnings,
  };
}
