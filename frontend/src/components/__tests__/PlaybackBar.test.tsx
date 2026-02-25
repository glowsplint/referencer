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
  describe("when playing", () => {
    it("then shows all playback controls", () => {
      renderPlaybackBar();

      expect(screen.getByTestId("playbackBar")).toBeInTheDocument();
      expect(screen.getByTestId("playbackPrevious")).toBeInTheDocument();
      expect(screen.getByTestId("playbackNext")).toBeInTheDocument();
      expect(screen.getByTestId("playbackToggleAutoPlay")).toBeInTheDocument();
      expect(screen.getByTestId("playbackStop")).toBeInTheDocument();
    });

    it("then shows the recording name", () => {
      renderPlaybackBar();
      expect(screen.getByText("Test Presentation")).toBeInTheDocument();
    });

    it("then shows the step counter", () => {
      renderPlaybackBar();
      const counter = screen.getByTestId("playbackStepCounter");
      expect(counter).toBeInTheDocument();
      // currentStepIndex=-1 means step 1 of 3 (initial + 2 steps)
      expect(counter.textContent).toContain("1");
      expect(counter.textContent).toContain("3");
    });
  });

  describe("when not playing", () => {
    it("then hides the playback bar", () => {
      renderPlaybackBar({
        playback: {
          ...makeMockRecordingContext().playback,
          isPlaying: false,
        },
      });

      expect(screen.queryByTestId("playbackBar")).not.toBeInTheDocument();
    });
  });

  describe("when at a different step", () => {
    it("then updates the step counter", () => {
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
  });

  describe("when the previous button is clicked", () => {
    it("then calls previousStep", () => {
      const { ctx } = renderPlaybackBar({
        playback: {
          ...makeMockRecordingContext().playback,
          currentStepIndex: 1,
        },
      });

      fireEvent.click(screen.getByTestId("playbackPrevious"));
      expect(ctx.playback.previousStep).toHaveBeenCalled();
    });
  });

  describe("when the next button is clicked", () => {
    it("then calls nextStep", () => {
      const { ctx } = renderPlaybackBar();

      fireEvent.click(screen.getByTestId("playbackNext"));
      expect(ctx.playback.nextStep).toHaveBeenCalled();
    });
  });

  describe("when the autoplay button is clicked", () => {
    it("then calls toggleAutoPlay", () => {
      const { ctx } = renderPlaybackBar();

      fireEvent.click(screen.getByTestId("playbackToggleAutoPlay"));
      expect(ctx.playback.toggleAutoPlay).toHaveBeenCalled();
    });
  });

  describe("when the stop button is clicked", () => {
    it("then calls stopPlayback", () => {
      const { ctx } = renderPlaybackBar();

      fireEvent.click(screen.getByTestId("playbackStop"));
      expect(ctx.playback.stopPlayback).toHaveBeenCalled();
    });
  });

  describe("when at the first step", () => {
    it("then disables the previous button", () => {
      renderPlaybackBar();
      expect(screen.getByTestId("playbackPrevious")).toBeDisabled();
    });
  });

  describe("when at the last step", () => {
    it("then disables the next button", () => {
      renderPlaybackBar({
        playback: {
          ...makeMockRecordingContext().playback,
          currentStepIndex: 1, // totalSteps - 1 = 1
        },
      });
      expect(screen.getByTestId("playbackNext")).toBeDisabled();
    });
  });

  describe("when hasWarnings is true", () => {
    it("then shows the warning icon", () => {
      renderPlaybackBar({
        playback: {
          ...makeMockRecordingContext().playback,
          hasWarnings: true,
        },
      });

      expect(screen.getByTestId("playbackWarning")).toBeInTheDocument();
    });
  });

  describe("when hasWarnings is false", () => {
    it("then hides the warning icon", () => {
      renderPlaybackBar();
      expect(screen.queryByTestId("playbackWarning")).not.toBeInTheDocument();
    });
  });

  describe("keyboard shortcuts", () => {
    describe("when ArrowRight is pressed", () => {
      it("then calls nextStep", () => {
        const { ctx } = renderPlaybackBar();

        fireEvent.keyDown(document, { key: "ArrowRight" });
        expect(ctx.playback.nextStep).toHaveBeenCalled();
      });
    });

    describe("when ArrowLeft is pressed", () => {
      it("then calls previousStep", () => {
        const { ctx } = renderPlaybackBar({
          playback: {
            ...makeMockRecordingContext().playback,
            currentStepIndex: 1,
          },
        });

        fireEvent.keyDown(document, { key: "ArrowLeft" });
        expect(ctx.playback.previousStep).toHaveBeenCalled();
      });
    });

    describe("when Space is pressed", () => {
      it("then calls toggleAutoPlay", () => {
        const { ctx } = renderPlaybackBar();

        fireEvent.keyDown(document, { key: " " });
        expect(ctx.playback.toggleAutoPlay).toHaveBeenCalled();
      });
    });

    describe("when Escape is pressed", () => {
      it("then calls stopPlayback", () => {
        const { ctx } = renderPlaybackBar();

        fireEvent.keyDown(document, { key: "Escape" });
        expect(ctx.playback.stopPlayback).toHaveBeenCalled();
      });
    });
  });
});
