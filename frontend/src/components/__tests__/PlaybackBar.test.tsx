import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PlaybackBar } from "../PlaybackBar";
import { RecordingProvider, type RecordingContextValue } from "@/contexts/RecordingContext";
import type { Recording } from "@/types/recording";

const testRecording: Recording = {
  id: "rec-1",
  name: "Test Presentation",
  initialState: {
    layers: { "layer-1": true },
    annotations: {},
    sections: { 0: true },
  },
  steps: [
    { id: "s1", delta: { "layer:layer-1": false } },
    { id: "s2", delta: { "layer:layer-1": true } },
  ],
  globalDelayMs: 1000,
  transitionType: "instant",
  createdAt: 1000,
  updatedAt: 1000,
};

function makeMockRecordingContext(
  overrides?: Partial<RecordingContextValue>,
): RecordingContextValue {
  return {
    recordings: {
      recordings: [testRecording],
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
    },
    playback: {
      isPlaying: true,
      isAutoPlaying: false,
      activeRecordingId: "rec-1",
      currentStepIndex: -1,
      totalSteps: 2,
      startPlayback: vi.fn(),
      stopPlayback: vi.fn(),
      nextStep: vi.fn(),
      previousStep: vi.fn(),
      goToStep: vi.fn(),
      toggleAutoPlay: vi.fn(),
      currentSnapshot: null,
      hasWarnings: false,
    },
    ...overrides,
  } as RecordingContextValue;
}

function renderPlaybackBar(overrides?: Partial<RecordingContextValue>) {
  const ctx = makeMockRecordingContext(overrides);
  return {
    ...render(
      <RecordingProvider value={ctx}>
        <PlaybackBar />
      </RecordingProvider>,
    ),
    ctx,
  };
}

describe("PlaybackBar", () => {
  it("renders playback controls when playing", () => {
    renderPlaybackBar();

    expect(screen.getByTestId("playbackBar")).toBeInTheDocument();
    expect(screen.getByTestId("playbackPrevious")).toBeInTheDocument();
    expect(screen.getByTestId("playbackNext")).toBeInTheDocument();
    expect(screen.getByTestId("playbackToggleAutoPlay")).toBeInTheDocument();
    expect(screen.getByTestId("playbackStop")).toBeInTheDocument();
  });

  it("does not render when not playing", () => {
    renderPlaybackBar({
      playback: {
        ...makeMockRecordingContext().playback,
        isPlaying: false,
      },
    });

    expect(screen.queryByTestId("playbackBar")).not.toBeInTheDocument();
  });

  it("displays recording name", () => {
    renderPlaybackBar();
    expect(screen.getByText("Test Presentation")).toBeInTheDocument();
  });

  it("displays step counter", () => {
    renderPlaybackBar();
    // currentStepIndex=-1 means step 1 of 3 (initial + 2 steps)
    const counter = screen.getByTestId("playbackStepCounter");
    expect(counter).toBeInTheDocument();
    // "1 / 3" since currentStepIndex=-1 -> display 1, totalSteps=2 -> display 3
    expect(counter.textContent).toContain("1");
    expect(counter.textContent).toContain("3");
  });

  it("updates step counter for different step", () => {
    renderPlaybackBar({
      playback: {
        ...makeMockRecordingContext().playback,
        currentStepIndex: 0,
      },
    });
    const counter = screen.getByTestId("playbackStepCounter");
    // currentStepIndex=0 -> display 2
    expect(counter.textContent).toContain("2");
  });

  it("calls previousStep when previous button is clicked", () => {
    const { ctx } = renderPlaybackBar({
      playback: {
        ...makeMockRecordingContext().playback,
        currentStepIndex: 1,
      },
    });

    fireEvent.click(screen.getByTestId("playbackPrevious"));
    expect(ctx.playback.previousStep).toHaveBeenCalled();
  });

  it("calls nextStep when next button is clicked", () => {
    const { ctx } = renderPlaybackBar();

    fireEvent.click(screen.getByTestId("playbackNext"));
    expect(ctx.playback.nextStep).toHaveBeenCalled();
  });

  it("calls toggleAutoPlay when play/pause button is clicked", () => {
    const { ctx } = renderPlaybackBar();

    fireEvent.click(screen.getByTestId("playbackToggleAutoPlay"));
    expect(ctx.playback.toggleAutoPlay).toHaveBeenCalled();
  });

  it("calls stopPlayback when stop button is clicked", () => {
    const { ctx } = renderPlaybackBar();

    fireEvent.click(screen.getByTestId("playbackStop"));
    expect(ctx.playback.stopPlayback).toHaveBeenCalled();
  });

  it("disables previous button at initial state (stepIndex -1)", () => {
    renderPlaybackBar();
    expect(screen.getByTestId("playbackPrevious")).toBeDisabled();
  });

  it("disables next button at last step", () => {
    renderPlaybackBar({
      playback: {
        ...makeMockRecordingContext().playback,
        currentStepIndex: 1, // totalSteps - 1 = 1
      },
    });
    expect(screen.getByTestId("playbackNext")).toBeDisabled();
  });

  it("shows warning icon when hasWarnings is true", () => {
    renderPlaybackBar({
      playback: {
        ...makeMockRecordingContext().playback,
        hasWarnings: true,
      },
    });

    expect(screen.getByTestId("playbackWarning")).toBeInTheDocument();
  });

  it("does not show warning icon when hasWarnings is false", () => {
    renderPlaybackBar();
    expect(screen.queryByTestId("playbackWarning")).not.toBeInTheDocument();
  });

  it("handles keyboard shortcut ArrowRight for next step", () => {
    const { ctx } = renderPlaybackBar();

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(ctx.playback.nextStep).toHaveBeenCalled();
  });

  it("handles keyboard shortcut ArrowLeft for previous step", () => {
    const { ctx } = renderPlaybackBar({
      playback: {
        ...makeMockRecordingContext().playback,
        currentStepIndex: 1,
      },
    });

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(ctx.playback.previousStep).toHaveBeenCalled();
  });

  it("handles keyboard shortcut Space for toggleAutoPlay", () => {
    const { ctx } = renderPlaybackBar();

    fireEvent.keyDown(document, { key: " " });
    expect(ctx.playback.toggleAutoPlay).toHaveBeenCalled();
  });

  it("handles keyboard shortcut Escape for stopPlayback", () => {
    const { ctx } = renderPlaybackBar();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(ctx.playback.stopPlayback).toHaveBeenCalled();
  });
});
