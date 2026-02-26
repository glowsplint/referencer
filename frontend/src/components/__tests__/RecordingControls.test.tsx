import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecordingControls } from "../RecordingControls";
import { RecordingProvider, type RecordingContextValue } from "@/contexts/RecordingContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { makeMockWorkspace } from "@/test/render-with-workspace";
import type { Recording } from "@/types/recording";

const testRecording: Recording = {
  id: "rec-1",
  name: "Test Recording",
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
      recordings: [],
      isRecording: false,
      activeRecordingId: null,
      createRecording: vi.fn().mockReturnValue("new-rec-id"),
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
    },
    ...overrides,
  } as RecordingContextValue;
}

function renderRecordingControls(
  recOverrides?: Partial<RecordingContextValue>,
  workspaceOverrides?: Record<string, unknown>,
) {
  const recCtx = makeMockRecordingContext(recOverrides);
  const workspace = makeMockWorkspace({
    settings: {
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: true,
      hideOffscreenArrows: false,
      showStatusBar: true,
    },
    ...workspaceOverrides,
  });
  return {
    ...render(
      <WorkspaceProvider value={workspace}>
        <RecordingProvider value={recCtx}>
          <RecordingControls />
        </RecordingProvider>
      </WorkspaceProvider>,
    ),
    recCtx,
    workspace,
  };
}

describe("RecordingControls", () => {
  describe("when rendered", () => {
    it("then shows the record button", () => {
      renderRecordingControls();
      expect(screen.getByTestId("recordButton")).toBeInTheDocument();
    });

    it("then shows the dropdown toggle", () => {
      renderRecordingControls();
      expect(screen.getByTestId("recordingDropdownToggle")).toBeInTheDocument();
    });
  });

  describe("when idle and record button is clicked", () => {
    it("then creates and starts a new recording", () => {
      const { recCtx } = renderRecordingControls();

      fireEvent.click(screen.getByTestId("recordButton"));

      expect(recCtx.recordings.createRecording).toHaveBeenCalled();
      expect(recCtx.recordings.startRecording).toHaveBeenCalledWith("new-rec-id");
    });
  });

  describe("when recording and record button is clicked", () => {
    it("then stops recording", () => {
      const { recCtx } = renderRecordingControls({
        recordings: {
          ...makeMockRecordingContext().recordings,
          isRecording: true,
          activeRecordingId: "rec-1",
        },
      });

      fireEvent.click(screen.getByTestId("recordButton"));
      expect(recCtx.recordings.stopRecording).toHaveBeenCalled();
    });
  });

  describe("when dropdown toggle is clicked", () => {
    it("then shows the recording dropdown", () => {
      renderRecordingControls();

      expect(screen.queryByTestId("recordingDropdown")).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("recordingDropdownToggle"));

      expect(screen.getByTestId("recordingDropdown")).toBeInTheDocument();
    });
  });

  describe("when dropdown is open with no recordings", () => {
    it("then shows a no-recordings message", () => {
      renderRecordingControls();

      fireEvent.click(screen.getByTestId("recordingDropdownToggle"));

      expect(screen.getByText(/no recordings/i)).toBeInTheDocument();
    });

    it("then shows the new recording button", () => {
      renderRecordingControls();

      fireEvent.click(screen.getByTestId("recordingDropdownToggle"));

      expect(screen.getByTestId("newRecordingButton")).toBeInTheDocument();
    });
  });

  describe("when dropdown is open with recordings", () => {
    it("then shows recording items with name and step count", () => {
      renderRecordingControls({
        recordings: {
          ...makeMockRecordingContext().recordings,
          recordings: [testRecording],
        },
      });

      fireEvent.click(screen.getByTestId("recordingDropdownToggle"));

      expect(screen.getByTestId("recordingItem-rec-1")).toBeInTheDocument();
      expect(screen.getByText("Test Recording")).toBeInTheDocument();
      expect(screen.getByText("2 steps")).toBeInTheDocument();
    });
  });

  describe("when play button on a recording is clicked", () => {
    it("then starts playback for that recording", () => {
      const { recCtx } = renderRecordingControls({
        recordings: {
          ...makeMockRecordingContext().recordings,
          recordings: [testRecording],
        },
      });

      fireEvent.click(screen.getByTestId("recordingDropdownToggle"));
      fireEvent.click(screen.getByTestId("recordingPlay-rec-1"));

      expect(recCtx.playback.startPlayback).toHaveBeenCalledWith("rec-1");
    });
  });

  describe("when readOnly", () => {
    it("then disables the record button", () => {
      renderRecordingControls({}, { readOnly: true });

      expect(screen.getByTestId("recordButton")).toBeDisabled();
    });
  });

  describe("when playback is active", () => {
    it("then disables the record button", () => {
      renderRecordingControls({
        playback: {
          ...makeMockRecordingContext().playback,
          isPlaying: true,
        },
      });

      expect(screen.getByTestId("recordButton")).toBeDisabled();
    });
  });
});
