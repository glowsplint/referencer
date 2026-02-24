import { useEffect, useState, useCallback, useRef } from "react";
import type * as Y from "yjs";
import type { Layer } from "@/types/editor";
import type {
  Recording,
  RecordingStep,
  VisibilitySnapshot,
  VisibilityDelta,
  TransitionType,
} from "@/types/recording";
import {
  getRecordingsArray,
  readRecordings,
  addRecordingToDoc,
  removeRecordingFromDoc,
  updateRecordingNameInDoc,
  updateRecordingSettingsInDoc,
  addStepToRecordingInDoc,
  removeStepFromRecordingInDoc,
  reorderStepsInRecordingInDoc,
  updateRecordingInitialStateInDoc,
} from "@/lib/yjs/recordings";

// Helper: build a complete VisibilitySnapshot from current state
export function captureVisibilitySnapshot(
  layers: Layer[],
  sectionVisibility: Record<number, boolean>,
): VisibilitySnapshot {
  const snapshot: VisibilitySnapshot = {
    layers: {},
    annotations: {},
    sections: { ...sectionVisibility },
  };
  for (const layer of layers) {
    snapshot.layers[layer.id] = layer.visible;
    for (const h of layer.highlights) {
      snapshot.annotations[`highlight:${layer.id}:${h.id}`] = h.visible;
    }
    for (const a of layer.arrows) {
      snapshot.annotations[`arrow:${layer.id}:${a.id}`] = a.visible;
    }
    for (const u of layer.underlines) {
      snapshot.annotations[`underline:${layer.id}:${u.id}`] = u.visible;
    }
  }
  return snapshot;
}

// Helper: compute delta between two snapshots
export function computeDelta(prev: VisibilitySnapshot, curr: VisibilitySnapshot): VisibilityDelta {
  const delta: VisibilityDelta = {};

  // Compare layers
  for (const [id, visible] of Object.entries(curr.layers)) {
    if (prev.layers[id] !== visible) {
      delta[`layer:${id}`] = visible;
    }
  }
  // Check removed layers
  for (const id of Object.keys(prev.layers)) {
    if (!(id in curr.layers)) {
      delta[`layer:${id}`] = false;
    }
  }

  // Compare annotations
  for (const [key, visible] of Object.entries(curr.annotations)) {
    if (prev.annotations[key] !== visible) {
      delta[key] = visible;
    }
  }
  // Check removed annotations
  for (const key of Object.keys(prev.annotations)) {
    if (!(key in curr.annotations)) {
      delta[key] = false;
    }
  }

  // Compare sections
  for (const [idx, visible] of Object.entries(curr.sections)) {
    if (prev.sections[Number(idx)] !== visible) {
      delta[`section:${idx}`] = visible;
    }
  }
  // Check removed sections
  for (const idx of Object.keys(prev.sections)) {
    if (!(Number(idx) in curr.sections)) {
      delta[`section:${idx}`] = false;
    }
  }

  return delta;
}

export function useRecordings(
  doc: Y.Doc | null,
  layers: Layer[],
  sectionVisibility: Record<number, boolean>,
) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);

  // Ref for tracking the last snapshot during recording (for delta computation)
  const lastSnapshotRef = useRef<VisibilitySnapshot | null>(null);
  // Ref for debounce timer
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref for pending delta accumulation during debounce window
  const pendingDeltaRef = useRef<VisibilityDelta>({});
  // Stable ref for current doc (used inside debounced callback)
  const docRef = useRef(doc);
  docRef.current = doc;
  // Stable ref for activeRecordingId (used inside debounced callback)
  const activeRecordingIdRef = useRef(activeRecordingId);
  activeRecordingIdRef.current = activeRecordingId;

  // Subscribe to Yjs changes and re-read recordings
  useEffect(() => {
    if (!doc) return;

    const yRecordings = getRecordingsArray(doc);

    const refresh = () => {
      setRecordings(readRecordings(doc));
    };

    yRecordings.observeDeep(refresh);
    refresh();

    return () => {
      yRecordings.unobserveDeep(refresh);
    };
  }, [doc]);

  // Auto-capture deltas during recording mode
  useEffect(() => {
    if (!isRecording || !activeRecordingId || !doc) return;

    const currentSnapshot = captureVisibilitySnapshot(layers, sectionVisibility);

    // If no previous snapshot, this is the first render after starting recording.
    // The initial snapshot was already set in startRecording, so just store it.
    if (!lastSnapshotRef.current) {
      lastSnapshotRef.current = currentSnapshot;
      return;
    }

    const delta = computeDelta(lastSnapshotRef.current, currentSnapshot);

    // Skip if nothing changed
    if (Object.keys(delta).length === 0) return;

    // Merge into pending delta (later changes overwrite earlier for same key)
    for (const [key, value] of Object.entries(delta)) {
      pendingDeltaRef.current[key] = value;
    }

    // Update snapshot immediately so subsequent changes compute correctly
    lastSnapshotRef.current = currentSnapshot;

    // Debounce: flush pending delta after 100ms of quiet
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentDoc = docRef.current;
      const recId = activeRecordingIdRef.current;
      const pending = pendingDeltaRef.current;

      if (!currentDoc || !recId || Object.keys(pending).length === 0) return;

      const step: RecordingStep = {
        id: crypto.randomUUID(),
        delta: { ...pending },
      };

      addStepToRecordingInDoc(currentDoc, recId, step);
      pendingDeltaRef.current = {};
    }, 100);
  }, [isRecording, activeRecordingId, doc, layers, sectionVisibility]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const createRecording = useCallback(
    (name: string): string => {
      if (!doc) return "";
      const id = crypto.randomUUID();
      const now = Date.now();
      const recording: Recording = {
        id,
        name,
        initialState: captureVisibilitySnapshot(layers, sectionVisibility),
        steps: [],
        globalDelayMs: 1000,
        transitionType: "instant",
        createdAt: now,
        updatedAt: now,
      };
      addRecordingToDoc(doc, recording);
      return id;
    },
    [doc, layers, sectionVisibility],
  );

  const deleteRecording = useCallback(
    (id: string) => {
      if (!doc) return;
      // Stop recording if deleting the active one
      if (activeRecordingId === id) {
        setIsRecording(false);
        setActiveRecordingId(null);
        lastSnapshotRef.current = null;
        pendingDeltaRef.current = {};
      }
      removeRecordingFromDoc(doc, id);
    },
    [doc, activeRecordingId],
  );

  const renameRecording = useCallback(
    (id: string, name: string) => {
      if (!doc) return;
      updateRecordingNameInDoc(doc, id, name);
    },
    [doc],
  );

  const duplicateRecording = useCallback(
    (id: string): string => {
      if (!doc) return "";
      const source = recordings.find((r) => r.id === id);
      if (!source) return "";
      const newId = crypto.randomUUID();
      const now = Date.now();
      const duplicate: Recording = {
        ...source,
        id: newId,
        name: `${source.name} (copy)`,
        steps: source.steps.map((s) => ({ ...s, id: crypto.randomUUID() })),
        createdAt: now,
        updatedAt: now,
      };
      addRecordingToDoc(doc, duplicate);
      return newId;
    },
    [doc, recordings],
  );

  const startRecording = useCallback(
    (recordingId: string) => {
      if (!doc) return;
      const snapshot = captureVisibilitySnapshot(layers, sectionVisibility);
      updateRecordingInitialStateInDoc(doc, recordingId, snapshot);
      lastSnapshotRef.current = snapshot;
      pendingDeltaRef.current = {};
      setActiveRecordingId(recordingId);
      setIsRecording(true);
    },
    [doc, layers, sectionVisibility],
  );

  const stopRecording = useCallback(() => {
    // Flush any pending delta before stopping
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentDoc = docRef.current;
    const recId = activeRecordingIdRef.current;
    const pending = pendingDeltaRef.current;

    if (currentDoc && recId && Object.keys(pending).length > 0) {
      const step: RecordingStep = {
        id: crypto.randomUUID(),
        delta: { ...pending },
      };
      addStepToRecordingInDoc(currentDoc, recId, step);
    }

    // Auto-delete empty recordings
    const currentRecId = activeRecordingIdRef.current;
    const currentDoc2 = docRef.current;
    if (currentRecId && currentDoc2) {
      const currentRecordings = readRecordings(currentDoc2);
      const rec = currentRecordings.find((r) => r.id === currentRecId);
      if (rec && rec.steps.length === 0) {
        removeRecordingFromDoc(currentDoc2, currentRecId);
      }
    }

    pendingDeltaRef.current = {};
    lastSnapshotRef.current = null;
    setIsRecording(false);
    setActiveRecordingId(null);
  }, []);

  const deleteStep = useCallback(
    (recordingId: string, stepId: string) => {
      if (!doc) return;
      removeStepFromRecordingInDoc(doc, recordingId, stepId);
    },
    [doc],
  );

  const reorderSteps = useCallback(
    (recordingId: string, stepIds: string[]) => {
      if (!doc) return;
      reorderStepsInRecordingInDoc(doc, recordingId, stepIds);
    },
    [doc],
  );

  const updateRecordingSettings = useCallback(
    (id: string, settings: { globalDelayMs?: number; transitionType?: TransitionType }) => {
      if (!doc) return;
      updateRecordingSettingsInDoc(doc, id, settings);
    },
    [doc],
  );

  return {
    recordings,
    isRecording,
    activeRecordingId,
    createRecording,
    deleteRecording,
    renameRecording,
    duplicateRecording,
    startRecording,
    stopRecording,
    deleteStep,
    reorderSteps,
    updateRecordingSettings,
  };
}
