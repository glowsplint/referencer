import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock the sub-hooks
vi.mock("./use-recordings", () => ({
  useRecordings: vi.fn(),
}));
vi.mock("./use-playback", () => ({
  usePlayback: vi.fn(),
}));
vi.mock("@/lib/yjs/annotations", () => ({
  setAnnotationVisibilityInDoc: vi.fn(),
}));

import { useRecordingManager } from "./use-recording-manager";
import { useRecordings } from "./use-recordings";
import { usePlayback } from "./use-playback";
import { setAnnotationVisibilityInDoc } from "@/lib/yjs/annotations";
import type { VisibilitySnapshot } from "@/types/recording";
import type { Layer } from "@/types/editor";

const mockRecordingsReturn = {
  recordings: [],
  isRecording: false,
  activeRecordingId: null,
  createRecording: vi.fn(),
  deleteRecording: vi.fn(),
  renameRecording: vi.fn(),
  duplicateRecording: vi.fn(),
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  deleteStep: vi.fn(),
  reorderSteps: vi.fn(),
  updateRecordingSettings: vi.fn(),
};

const mockPlaybackReturn = {
  isPlaying: false,
  isAutoPlaying: false,
  activeRecordingId: null,
  currentStepIndex: -1,
  totalSteps: 0,
  startPlayback: vi.fn(),
  stopPlayback: vi.fn(),
  nextStep: vi.fn(),
  previousStep: vi.fn(),
  goToStep: vi.fn(),
  toggleAutoPlay: vi.fn(),
  currentSnapshot: null,
  hasWarnings: false,
};

function createLayer(overrides?: Partial<Layer>): Layer {
  return {
    id: "layer-1",
    name: "Layer 1",
    color: "#ff0000",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
    ...overrides,
  };
}

describe("useRecordingManager", () => {
  const toggleLayerVisibility = vi.fn();
  const toggleSectionVisibility = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRecordings).mockReturnValue(mockRecordingsReturn);
    vi.mocked(usePlayback).mockReturnValue(mockPlaybackReturn);
  });

  it("when accessed, then composes useRecordings and usePlayback into a single value", () => {
    const { result } = renderHook(() =>
      useRecordingManager({
        doc: null,
        layers: [],
        sectionVisibility: {},
        toggleLayerVisibility,
        toggleSectionVisibility,
      }),
    );

    expect(result.current.recordings).toBe(mockRecordingsReturn);
    expect(result.current.playback).toBe(mockPlaybackReturn);
  });

  it("when rendering, then passes applyVisibilitySnapshot to usePlayback", () => {
    renderHook(() =>
      useRecordingManager({
        doc: null,
        layers: [],
        sectionVisibility: {},
        toggleLayerVisibility,
        toggleSectionVisibility,
      }),
    );

    // usePlayback should have been called with recordings and a function
    expect(usePlayback).toHaveBeenCalledWith(
      mockRecordingsReturn.recordings,
      expect.any(Function),
    );
  });

  it("when applyVisibilitySnapshot is called, then toggles layer visibility to match snapshot", () => {
    const layers = [
      createLayer({ id: "layer-1", visible: true }),
      createLayer({ id: "layer-2", visible: false }),
    ];

    renderHook(() =>
      useRecordingManager({
        doc: null,
        layers,
        sectionVisibility: {},
        toggleLayerVisibility,
        toggleSectionVisibility,
      }),
    );

    // Extract the applyVisibilitySnapshot that was passed to usePlayback
    const applyFn = vi.mocked(usePlayback).mock.calls[0][1];

    const snapshot: VisibilitySnapshot = {
      layers: { "layer-1": false, "layer-2": true },
      annotations: {},
      sections: {},
    };

    applyFn(snapshot);

    // layer-1 is currently visible=true but snapshot wants false -> should toggle
    expect(toggleLayerVisibility).toHaveBeenCalledWith("layer-1");
    // layer-2 is currently visible=false but snapshot wants true -> should toggle
    expect(toggleLayerVisibility).toHaveBeenCalledWith("layer-2");
    expect(toggleLayerVisibility).toHaveBeenCalledTimes(2);
  });

  it("when layers already match the snapshot, then applyVisibilitySnapshot does not toggle them", () => {
    const layers = [createLayer({ id: "layer-1", visible: true })];

    renderHook(() =>
      useRecordingManager({
        doc: null,
        layers,
        sectionVisibility: {},
        toggleLayerVisibility,
        toggleSectionVisibility,
      }),
    );

    const applyFn = vi.mocked(usePlayback).mock.calls[0][1];

    const snapshot: VisibilitySnapshot = {
      layers: { "layer-1": true },
      annotations: {},
      sections: {},
    };

    applyFn(snapshot);
    expect(toggleLayerVisibility).not.toHaveBeenCalled();
  });

  it("when applyVisibilitySnapshot is called, then applies annotation visibility via Yjs doc", () => {
    const mockDoc = { transact: vi.fn((fn: () => void) => fn()) } as unknown as import("yjs").Doc;
    const layers = [createLayer({ id: "layer-1", visible: true })];

    renderHook(() =>
      useRecordingManager({
        doc: mockDoc,
        layers,
        sectionVisibility: {},
        toggleLayerVisibility,
        toggleSectionVisibility,
      }),
    );

    const applyFn = vi.mocked(usePlayback).mock.calls[0][1];

    const snapshot: VisibilitySnapshot = {
      layers: {},
      annotations: { "highlight:layer-1:h1": false },
      sections: {},
    };

    applyFn(snapshot);

    expect(mockDoc.transact).toHaveBeenCalled();
    expect(setAnnotationVisibilityInDoc).toHaveBeenCalledWith(
      mockDoc,
      "layer-1",
      "highlights",
      "h1",
      false,
    );
  });

  it("when applyVisibilitySnapshot is called, then toggles section visibility", () => {
    const layers: Layer[] = [];
    const sectionVisibility = { 0: true, 1: false };

    renderHook(() =>
      useRecordingManager({
        doc: null,
        layers,
        sectionVisibility,
        toggleLayerVisibility,
        toggleSectionVisibility,
      }),
    );

    const applyFn = vi.mocked(usePlayback).mock.calls[0][1];

    const snapshot: VisibilitySnapshot = {
      layers: {},
      annotations: {},
      sections: { 0: false, 1: true },
    };

    applyFn(snapshot);

    // section 0 is currently true but snapshot wants false -> toggle
    expect(toggleSectionVisibility).toHaveBeenCalledWith(0);
    // section 1 is currently false but snapshot wants true -> toggle
    expect(toggleSectionVisibility).toHaveBeenCalledWith(1);
    expect(toggleSectionVisibility).toHaveBeenCalledTimes(2);
  });

  it("when doc is null, then applyVisibilitySnapshot skips annotation doc updates", () => {
    renderHook(() =>
      useRecordingManager({
        doc: null,
        layers: [],
        sectionVisibility: {},
        toggleLayerVisibility,
        toggleSectionVisibility,
      }),
    );

    const applyFn = vi.mocked(usePlayback).mock.calls[0][1];

    const snapshot: VisibilitySnapshot = {
      layers: {},
      annotations: { "highlight:layer-1:h1": false },
      sections: {},
    };

    applyFn(snapshot);
    expect(setAnnotationVisibilityInDoc).not.toHaveBeenCalled();
  });
});
