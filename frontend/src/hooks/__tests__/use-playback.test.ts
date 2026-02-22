import { describe, it, expect, vi } from "vitest";
import { applyDelta, computeSnapshotAtStep } from "../use-playback";
import type { Recording, VisibilitySnapshot, VisibilityDelta } from "@/types/recording";

function createSnapshot(overrides?: Partial<VisibilitySnapshot>): VisibilitySnapshot {
  return {
    layers: { "layer-1": true, "layer-2": false },
    annotations: { "highlight:layer-1:h1": true, "arrow:layer-1:a1": false },
    sections: { 0: true, 1: false },
    ...overrides,
  };
}

function createRecording(overrides?: Partial<Recording>): Recording {
  return {
    id: "rec-1",
    name: "Test",
    initialState: createSnapshot(),
    steps: [],
    globalDelayMs: 1000,
    transitionType: "instant",
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe("applyDelta", () => {
  it("applies layer visibility change", () => {
    const snapshot = createSnapshot();
    const delta: VisibilityDelta = { "layer:layer-1": false };

    const { snapshot: result, warnings } = applyDelta(snapshot, delta);

    expect(result.layers["layer-1"]).toBe(false);
    expect(result.layers["layer-2"]).toBe(false); // unchanged
    expect(warnings).toEqual([]);
  });

  it("applies annotation visibility change", () => {
    const snapshot = createSnapshot();
    const delta: VisibilityDelta = { "highlight:layer-1:h1": false };

    const { snapshot: result, warnings } = applyDelta(snapshot, delta);

    expect(result.annotations["highlight:layer-1:h1"]).toBe(false);
    expect(result.annotations["arrow:layer-1:a1"]).toBe(false); // unchanged
    expect(warnings).toEqual([]);
  });

  it("applies section visibility change", () => {
    const snapshot = createSnapshot();
    const delta: VisibilityDelta = { "section:1": true };

    const { snapshot: result, warnings } = applyDelta(snapshot, delta);

    expect(result.sections[1]).toBe(true);
    expect(result.sections[0]).toBe(true); // unchanged
    expect(warnings).toEqual([]);
  });

  it("warns on missing layer", () => {
    const snapshot = createSnapshot();
    const delta: VisibilityDelta = { "layer:nonexistent": true };

    const { warnings } = applyDelta(snapshot, delta);

    expect(warnings).toEqual(["Layer nonexistent not found"]);
  });

  it("warns on missing annotation", () => {
    const snapshot = createSnapshot();
    const delta: VisibilityDelta = { "highlight:layer-1:missing": true };

    const { warnings } = applyDelta(snapshot, delta);

    expect(warnings).toEqual(["Annotation highlight:layer-1:missing not found"]);
  });

  it("skips missing entries gracefully without crashing", () => {
    const snapshot = createSnapshot();
    const delta: VisibilityDelta = {
      "layer:nonexistent": true,
      "highlight:layer-1:missing": false,
      "layer:layer-1": false, // this one is valid
    };

    const { snapshot: result, warnings } = applyDelta(snapshot, delta);

    expect(result.layers["layer-1"]).toBe(false);
    expect(warnings).toHaveLength(2);
    expect(warnings).toContain("Layer nonexistent not found");
    expect(warnings).toContain("Annotation highlight:layer-1:missing not found");
  });

  it("does not mutate the original snapshot", () => {
    const snapshot = createSnapshot();
    const delta: VisibilityDelta = { "layer:layer-1": false };

    applyDelta(snapshot, delta);

    expect(snapshot.layers["layer-1"]).toBe(true); // original unchanged
  });

  it("applies multiple changes in one delta", () => {
    const snapshot = createSnapshot();
    const delta: VisibilityDelta = {
      "layer:layer-1": false,
      "layer:layer-2": true,
      "highlight:layer-1:h1": false,
      "section:0": false,
    };

    const { snapshot: result, warnings } = applyDelta(snapshot, delta);

    expect(result.layers["layer-1"]).toBe(false);
    expect(result.layers["layer-2"]).toBe(true);
    expect(result.annotations["highlight:layer-1:h1"]).toBe(false);
    expect(result.sections[0]).toBe(false);
    expect(warnings).toEqual([]);
  });

  it("creates new section entries for sections not in original snapshot", () => {
    const snapshot = createSnapshot();
    const delta: VisibilityDelta = { "section:5": true };

    const { snapshot: result, warnings } = applyDelta(snapshot, delta);

    expect(result.sections[5]).toBe(true);
    expect(warnings).toEqual([]);
  });
});

describe("computeSnapshotAtStep", () => {
  it("returns initial state for stepIndex -1", () => {
    const recording = createRecording({
      steps: [{ id: "s1", delta: { "layer:layer-1": false } }],
    });

    const { snapshot, warnings } = computeSnapshotAtStep(recording, -1);

    expect(snapshot).toEqual(recording.initialState);
    expect(warnings).toEqual([]);
  });

  it("applies first delta for stepIndex 0", () => {
    const recording = createRecording({
      steps: [{ id: "s1", delta: { "layer:layer-1": false } }],
    });

    const { snapshot, warnings } = computeSnapshotAtStep(recording, 0);

    expect(snapshot.layers["layer-1"]).toBe(false);
    expect(snapshot.layers["layer-2"]).toBe(false); // unchanged from initial
    expect(warnings).toEqual([]);
  });

  it("applies all deltas up to stepIndex N", () => {
    const recording = createRecording({
      steps: [
        { id: "s1", delta: { "layer:layer-1": false } },
        { id: "s2", delta: { "layer:layer-2": true } },
        { id: "s3", delta: { "highlight:layer-1:h1": false } },
      ],
    });

    const { snapshot, warnings } = computeSnapshotAtStep(recording, 2);

    expect(snapshot.layers["layer-1"]).toBe(false);
    expect(snapshot.layers["layer-2"]).toBe(true);
    expect(snapshot.annotations["highlight:layer-1:h1"]).toBe(false);
    expect(warnings).toEqual([]);
  });

  it("applies only first two deltas for stepIndex 1", () => {
    const recording = createRecording({
      steps: [
        { id: "s1", delta: { "layer:layer-1": false } },
        { id: "s2", delta: { "layer:layer-2": true } },
        { id: "s3", delta: { "highlight:layer-1:h1": false } },
      ],
    });

    const { snapshot } = computeSnapshotAtStep(recording, 1);

    expect(snapshot.layers["layer-1"]).toBe(false);
    expect(snapshot.layers["layer-2"]).toBe(true);
    // h1 should still be true since step 2 (index=2) is not applied
    expect(snapshot.annotations["highlight:layer-1:h1"]).toBe(true);
  });

  it("collects warnings from missing annotations across steps", () => {
    const recording = createRecording({
      initialState: createSnapshot({
        annotations: { "highlight:layer-1:h1": true },
      }),
      steps: [
        { id: "s1", delta: { "highlight:layer-1:missing1": true } },
        { id: "s2", delta: { "highlight:layer-1:missing2": false } },
      ],
    });

    const { warnings } = computeSnapshotAtStep(recording, 1);

    expect(warnings).toHaveLength(2);
    expect(warnings).toContain("Annotation highlight:layer-1:missing1 not found");
    expect(warnings).toContain("Annotation highlight:layer-1:missing2 not found");
  });

  it("handles recording with no steps", () => {
    const recording = createRecording({ steps: [] });

    const { snapshot, warnings } = computeSnapshotAtStep(recording, 0);

    // With no steps, even stepIndex 0 returns initial state (loop body never executes)
    expect(snapshot).toEqual(recording.initialState);
    expect(warnings).toEqual([]);
  });

  it("clamps to available steps when stepIndex exceeds step count", () => {
    const recording = createRecording({
      steps: [{ id: "s1", delta: { "layer:layer-1": false } }],
    });

    // stepIndex 5 with only 1 step should just apply that one step
    const { snapshot } = computeSnapshotAtStep(recording, 5);

    expect(snapshot.layers["layer-1"]).toBe(false);
  });
});
