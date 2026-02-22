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
      showDrawingToasts: true,
      showCommentsToasts: true,
      showHighlightToasts: true,
      overscrollEnabled: false,
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
  it("renders record button", () => {
    renderRecordingControls();
    expect(screen.getByTestId("recordButton")).toBeInTheDocument();
  });

  it("renders dropdown toggle", () => {
    renderRecordingControls();
    expect(screen.getByTestId("recordingDropdownToggle")).toBeInTheDocument();
  });

  it("record button is not in recording state when idle", () => {
    renderRecordingControls();
    const btn = screen.getByTestId("recordButton");
    // When not recording, it should not have recording-state styling
    expect(btn.className).not.toContain("bg-red-500/20");
  });

  it("record button shows recording state when isRecording is true", () => {
    renderRecordingControls({
      recordings: {
        ...makeMockRecordingContext().recordings,
        isRecording: true,
        activeRecordingId: "rec-1",
      },
    });
    const btn = screen.getByTestId("recordButton");
    expect(btn.className).toContain("bg-red-500/20");
  });

  it("clicking record button creates and starts a new recording when idle", () => {
    const { recCtx } = renderRecordingControls();

    fireEvent.click(screen.getByTestId("recordButton"));

    expect(recCtx.recordings.createRecording).toHaveBeenCalled();
    expect(recCtx.recordings.startRecording).toHaveBeenCalledWith("new-rec-id");
  });

  it("clicking record button stops recording when isRecording is true", () => {
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

  it("opens dropdown when toggle is clicked", () => {
    renderRecordingControls();

    expect(screen.queryByTestId("recordingDropdown")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("recordingDropdownToggle"));

    expect(screen.getByTestId("recordingDropdown")).toBeInTheDocument();
  });

  it("shows no recordings message when list is empty", () => {
    renderRecordingControls();

    fireEvent.click(screen.getByTestId("recordingDropdownToggle"));

    expect(screen.getByText(/no recordings/i)).toBeInTheDocument();
  });

  it("shows recording items in dropdown when recordings exist", () => {
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

  it("shows new recording button in dropdown", () => {
    renderRecordingControls();

    fireEvent.click(screen.getByTestId("recordingDropdownToggle"));

    expect(screen.getByTestId("newRecordingButton")).toBeInTheDocument();
  });

  it("clicking play on a recording starts playback", () => {
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

  it("record button is disabled when readOnly", () => {
    renderRecordingControls({}, { readOnly: true });

    expect(screen.getByTestId("recordButton")).toBeDisabled();
  });

  it("record button is disabled during playback", () => {
    renderRecordingControls({
      playback: {
        ...makeMockRecordingContext().playback,
        isPlaying: true,
      },
    });

    expect(screen.getByTestId("recordButton")).toBeDisabled();
  });
});
