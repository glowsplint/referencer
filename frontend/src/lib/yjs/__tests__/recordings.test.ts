import { describe, it, expect } from "vitest";
import * as Y from "yjs";
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
} from "../recordings";
import type { Recording, RecordingStep, VisibilitySnapshot } from "@/types/recording";

function createTestRecording(overrides?: Partial<Recording>): Recording {
  return {
    id: "rec-1",
    name: "Test Recording",
    initialState: {
      layers: { "layer-1": true, "layer-2": false },
      annotations: { "highlight:layer-1:h1": true },
      sections: { 0: true, 1: true },
    },
    steps: [],
    globalDelayMs: 2000,
    transitionType: "instant",
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function createTestStep(id: string, delta: Record<string, boolean>): RecordingStep {
  return { id, delta };
}

describe("when using recordings Yjs storage", () => {
  it("then returns empty array for a fresh doc", () => {
    const doc = new Y.Doc();
    expect(readRecordings(doc)).toEqual([]);
  });

  it("then addRecordingToDoc stores a recording that readRecordings returns", () => {
    const doc = new Y.Doc();
    const rec = createTestRecording();
    addRecordingToDoc(doc, rec);

    const result = readRecordings(doc);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rec-1");
    expect(result[0].name).toBe("Test Recording");
    expect(result[0].initialState).toEqual(rec.initialState);
    expect(result[0].globalDelayMs).toBe(2000);
    expect(result[0].transitionType).toBe("instant");
    expect(result[0].steps).toEqual([]);
  });

  it("then addRecordingToDoc preserves steps", () => {
    const doc = new Y.Doc();
    const rec = createTestRecording({
      steps: [
        createTestStep("s1", { "layer:layer-1": false }),
        createTestStep("s2", { "layer:layer-2": true }),
      ],
    });
    addRecordingToDoc(doc, rec);

    const result = readRecordings(doc);
    expect(result[0].steps).toHaveLength(2);
    expect(result[0].steps[0].id).toBe("s1");
    expect(result[0].steps[0].delta).toEqual({ "layer:layer-1": false });
    expect(result[0].steps[1].id).toBe("s2");
    expect(result[0].steps[1].delta).toEqual({ "layer:layer-2": true });
  });

  it("then removeRecordingFromDoc removes the recording", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording());
    expect(readRecordings(doc)).toHaveLength(1);

    removeRecordingFromDoc(doc, "rec-1");
    expect(readRecordings(doc)).toHaveLength(0);
  });

  it("then removeRecordingFromDoc is a no-op for unknown id", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording());
    removeRecordingFromDoc(doc, "does-not-exist");
    expect(readRecordings(doc)).toHaveLength(1);
  });

  it("then updateRecordingNameInDoc changes the name and updatedAt", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording({ updatedAt: 1000 }));

    updateRecordingNameInDoc(doc, "rec-1", "Renamed");

    const result = readRecordings(doc);
    expect(result[0].name).toBe("Renamed");
    expect(result[0].updatedAt).toBeGreaterThan(1000);
  });

  it("then updateRecordingSettingsInDoc updates globalDelayMs", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording());

    updateRecordingSettingsInDoc(doc, "rec-1", { globalDelayMs: 5000 });

    const result = readRecordings(doc);
    expect(result[0].globalDelayMs).toBe(5000);
    expect(result[0].transitionType).toBe("instant"); // unchanged
  });

  it("then updateRecordingSettingsInDoc updates transitionType", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording());

    updateRecordingSettingsInDoc(doc, "rec-1", { transitionType: "fade" });

    const result = readRecordings(doc);
    expect(result[0].transitionType).toBe("fade");
    expect(result[0].globalDelayMs).toBe(2000); // unchanged
  });

  it("then updateRecordingSettingsInDoc updates both settings at once", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording({ updatedAt: 1000 }));

    updateRecordingSettingsInDoc(doc, "rec-1", {
      globalDelayMs: 3000,
      transitionType: "fade",
    });

    const result = readRecordings(doc);
    expect(result[0].globalDelayMs).toBe(3000);
    expect(result[0].transitionType).toBe("fade");
    expect(result[0].updatedAt).toBeGreaterThan(1000);
  });

  it("then addStepToRecordingInDoc appends a step", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording());

    const step = createTestStep("s1", { "layer:layer-1": false });
    addStepToRecordingInDoc(doc, "rec-1", step);

    const result = readRecordings(doc);
    expect(result[0].steps).toHaveLength(1);
    expect(result[0].steps[0].id).toBe("s1");
    expect(result[0].steps[0].delta).toEqual({ "layer:layer-1": false });
  });

  it("then addStepToRecordingInDoc appends multiple steps in order", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording());

    addStepToRecordingInDoc(doc, "rec-1", createTestStep("s1", { "layer:layer-1": false }));
    addStepToRecordingInDoc(doc, "rec-1", createTestStep("s2", { "layer:layer-2": true }));
    addStepToRecordingInDoc(doc, "rec-1", createTestStep("s3", { "section:0": false }));

    const result = readRecordings(doc);
    expect(result[0].steps).toHaveLength(3);
    expect(result[0].steps.map((s) => s.id)).toEqual(["s1", "s2", "s3"]);
  });

  it("then removeStepFromRecordingInDoc removes a specific step", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording());
    addStepToRecordingInDoc(doc, "rec-1", createTestStep("s1", { "layer:layer-1": false }));
    addStepToRecordingInDoc(doc, "rec-1", createTestStep("s2", { "layer:layer-2": true }));

    removeStepFromRecordingInDoc(doc, "rec-1", "s1");

    const result = readRecordings(doc);
    expect(result[0].steps).toHaveLength(1);
    expect(result[0].steps[0].id).toBe("s2");
  });

  it("then reorderStepsInRecordingInDoc reorders steps", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording());
    addStepToRecordingInDoc(doc, "rec-1", createTestStep("s1", { "layer:layer-1": false }));
    addStepToRecordingInDoc(doc, "rec-1", createTestStep("s2", { "layer:layer-2": true }));
    addStepToRecordingInDoc(doc, "rec-1", createTestStep("s3", { "section:0": false }));

    reorderStepsInRecordingInDoc(doc, "rec-1", ["s3", "s1", "s2"]);

    const result = readRecordings(doc);
    expect(result[0].steps.map((s) => s.id)).toEqual(["s3", "s1", "s2"]);
    // Verify deltas are preserved after reorder
    expect(result[0].steps[0].delta).toEqual({ "section:0": false });
    expect(result[0].steps[1].delta).toEqual({ "layer:layer-1": false });
    expect(result[0].steps[2].delta).toEqual({ "layer:layer-2": true });
  });

  it("then updateRecordingInitialStateInDoc changes the initial state", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording({ updatedAt: 1000 }));

    const newState: VisibilitySnapshot = {
      layers: { "layer-1": false },
      annotations: {},
      sections: { 0: false },
    };
    updateRecordingInitialStateInDoc(doc, "rec-1", newState);

    const result = readRecordings(doc);
    expect(result[0].initialState).toEqual(newState);
    expect(result[0].updatedAt).toBeGreaterThan(1000);
  });

  it("then handles multiple recordings: add 3, delete middle, verify", () => {
    const doc = new Y.Doc();
    addRecordingToDoc(doc, createTestRecording({ id: "rec-1", name: "First" }));
    addRecordingToDoc(doc, createTestRecording({ id: "rec-2", name: "Second" }));
    addRecordingToDoc(doc, createTestRecording({ id: "rec-3", name: "Third" }));

    expect(readRecordings(doc)).toHaveLength(3);

    removeRecordingFromDoc(doc, "rec-2");

    const result = readRecordings(doc);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("rec-1");
    expect(result[0].name).toBe("First");
    expect(result[1].id).toBe("rec-3");
    expect(result[1].name).toBe("Third");
  });

  it("then getRecordingsArray returns the Y.Array from the doc", () => {
    const doc = new Y.Doc();
    const arr = getRecordingsArray(doc);
    expect(arr).toBeInstanceOf(Y.Array);
    expect(arr.length).toBe(0);

    addRecordingToDoc(doc, createTestRecording());
    expect(arr.length).toBe(1);
  });
});
