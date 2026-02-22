// Yjs shared types for collaborative recordings.
// Recordings are stored as Y.Array<Y.Map> with nested step arrays.
// Complex objects (VisibilitySnapshot, VisibilityDelta) are stored as
// JSON strings for simplicity.
import * as Y from "yjs";
import type {
  Recording,
  RecordingStep,
  VisibilitySnapshot,
  VisibilityDelta,
  TransitionType,
} from "@/types/recording";

// ---------------------------------------------------------------------------
// Y.Doc structure for recordings
// ---------------------------------------------------------------------------
// doc.getArray("recordings")  →  Y.Array<Y.Map>
//   each Y.Map has:
//     id: string
//     name: string
//     initialState: string (JSON.stringify of VisibilitySnapshot)
//     steps: Y.Array<Y.Map>
//       each step Y.Map: id: string, delta: string (JSON.stringify of VisibilityDelta)
//     globalDelayMs: number
//     transitionType: string
//     createdAt: number
//     updatedAt: number

// ---------------------------------------------------------------------------
// Access helpers
// ---------------------------------------------------------------------------

export function getRecordingsArray(doc: Y.Doc): Y.Array<Y.Map<unknown>> {
  return doc.getArray("recordings");
}

function findYRecording(
  doc: Y.Doc,
  recordingId: string,
): { yRecording: Y.Map<unknown>; index: number } | null {
  const yRecordings = getRecordingsArray(doc);
  for (let i = 0; i < yRecordings.length; i++) {
    const yRec = yRecordings.get(i);
    if (yRec.get("id") === recordingId) return { yRecording: yRec, index: i };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Read: Convert Yjs state → plain Recording[] for React rendering
// ---------------------------------------------------------------------------

function readSteps(yRecording: Y.Map<unknown>): RecordingStep[] {
  const ySteps = yRecording.get("steps") as Y.Array<Y.Map<unknown>> | undefined;
  if (!ySteps) return [];

  const steps: RecordingStep[] = [];
  for (let i = 0; i < ySteps.length; i++) {
    const yStep = ySteps.get(i);
    steps.push({
      id: yStep.get("id") as string,
      delta: JSON.parse(yStep.get("delta") as string) as VisibilityDelta,
    });
  }
  return steps;
}

export function readRecordings(doc: Y.Doc): Recording[] {
  const yRecordings = getRecordingsArray(doc);
  const recordings: Recording[] = [];

  for (let i = 0; i < yRecordings.length; i++) {
    const yRec = yRecordings.get(i);
    recordings.push({
      id: yRec.get("id") as string,
      name: yRec.get("name") as string,
      initialState: JSON.parse(yRec.get("initialState") as string) as VisibilitySnapshot,
      steps: readSteps(yRec),
      globalDelayMs: yRec.get("globalDelayMs") as number,
      transitionType: yRec.get("transitionType") as TransitionType,
      createdAt: yRec.get("createdAt") as number,
      updatedAt: yRec.get("updatedAt") as number,
    });
  }

  return recordings;
}

// ---------------------------------------------------------------------------
// Write: Mutation helpers for Yjs recordings
// ---------------------------------------------------------------------------

export function addRecordingToDoc(doc: Y.Doc, recording: Recording): void {
  const yRecordings = getRecordingsArray(doc);

  doc.transact(() => {
    const yRec = new Y.Map<unknown>();
    yRec.set("id", recording.id);
    yRec.set("name", recording.name);
    yRec.set("initialState", JSON.stringify(recording.initialState));
    yRec.set("globalDelayMs", recording.globalDelayMs);
    yRec.set("transitionType", recording.transitionType);
    yRec.set("createdAt", recording.createdAt);
    yRec.set("updatedAt", recording.updatedAt);

    const ySteps = new Y.Array<Y.Map<unknown>>();
    for (const step of recording.steps) {
      const yStep = new Y.Map<unknown>();
      yStep.set("id", step.id);
      yStep.set("delta", JSON.stringify(step.delta));
      ySteps.push([yStep]);
    }
    yRec.set("steps", ySteps);

    yRecordings.push([yRec]);
  });
}

export function removeRecordingFromDoc(doc: Y.Doc, recordingId: string): void {
  const result = findYRecording(doc, recordingId);
  if (!result) return;
  getRecordingsArray(doc).delete(result.index);
}

export function updateRecordingNameInDoc(doc: Y.Doc, recordingId: string, name: string): void {
  const result = findYRecording(doc, recordingId);
  if (!result) return;
  doc.transact(() => {
    result.yRecording.set("name", name);
    result.yRecording.set("updatedAt", Date.now());
  });
}

export function updateRecordingSettingsInDoc(
  doc: Y.Doc,
  recordingId: string,
  settings: { globalDelayMs?: number; transitionType?: TransitionType },
): void {
  const result = findYRecording(doc, recordingId);
  if (!result) return;
  doc.transact(() => {
    if (settings.globalDelayMs !== undefined) {
      result.yRecording.set("globalDelayMs", settings.globalDelayMs);
    }
    if (settings.transitionType !== undefined) {
      result.yRecording.set("transitionType", settings.transitionType);
    }
    result.yRecording.set("updatedAt", Date.now());
  });
}

export function addStepToRecordingInDoc(
  doc: Y.Doc,
  recordingId: string,
  step: RecordingStep,
): void {
  const result = findYRecording(doc, recordingId);
  if (!result) return;
  const ySteps = result.yRecording.get("steps") as Y.Array<Y.Map<unknown>>;
  doc.transact(() => {
    const yStep = new Y.Map<unknown>();
    yStep.set("id", step.id);
    yStep.set("delta", JSON.stringify(step.delta));
    ySteps.push([yStep]);
    result.yRecording.set("updatedAt", Date.now());
  });
}

export function removeStepFromRecordingInDoc(
  doc: Y.Doc,
  recordingId: string,
  stepId: string,
): void {
  const result = findYRecording(doc, recordingId);
  if (!result) return;
  const ySteps = result.yRecording.get("steps") as Y.Array<Y.Map<unknown>>;
  doc.transact(() => {
    for (let i = 0; i < ySteps.length; i++) {
      if (ySteps.get(i).get("id") === stepId) {
        ySteps.delete(i);
        break;
      }
    }
    result.yRecording.set("updatedAt", Date.now());
  });
}

export function reorderStepsInRecordingInDoc(
  doc: Y.Doc,
  recordingId: string,
  stepIds: string[],
): void {
  const result = findYRecording(doc, recordingId);
  if (!result) return;
  const ySteps = result.yRecording.get("steps") as Y.Array<Y.Map<unknown>>;

  // Read current steps into a map for lookup
  const stepMap = new Map<string, { id: string; delta: string }>();
  for (let i = 0; i < ySteps.length; i++) {
    const yStep = ySteps.get(i);
    stepMap.set(yStep.get("id") as string, {
      id: yStep.get("id") as string,
      delta: yStep.get("delta") as string,
    });
  }

  doc.transact(() => {
    // Clear existing steps
    if (ySteps.length > 0) {
      ySteps.delete(0, ySteps.length);
    }
    // Re-insert in new order
    for (const stepId of stepIds) {
      const data = stepMap.get(stepId);
      if (!data) continue;
      const yStep = new Y.Map<unknown>();
      yStep.set("id", data.id);
      yStep.set("delta", data.delta);
      ySteps.push([yStep]);
    }
    result.yRecording.set("updatedAt", Date.now());
  });
}

export function updateRecordingInitialStateInDoc(
  doc: Y.Doc,
  recordingId: string,
  initialState: VisibilitySnapshot,
): void {
  const result = findYRecording(doc, recordingId);
  if (!result) return;
  doc.transact(() => {
    result.yRecording.set("initialState", JSON.stringify(initialState));
    result.yRecording.set("updatedAt", Date.now());
  });
}
