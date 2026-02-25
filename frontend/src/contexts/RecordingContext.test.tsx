import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { RecordingProvider, useRecordingContext } from "./RecordingContext";
import type { RecordingContextValue } from "./RecordingContext";

function makeMockValue(): RecordingContextValue {
  return {
    recordings: {
      recordings: [],
      isRecording: false,
      activeRecordingId: null,
      createRecording: () => "",
      deleteRecording: () => {},
      renameRecording: () => {},
      duplicateRecording: () => "",
      startRecording: () => {},
      stopRecording: () => {},
      deleteStep: () => {},
      reorderSteps: () => {},
      updateRecordingSettings: () => {},
    },
    playback: {
      isPlaying: false,
      isAutoPlaying: false,
      activeRecordingId: null,
      currentStepIndex: -1,
      totalSteps: 0,
      startPlayback: () => {},
      stopPlayback: () => {},
      nextStep: () => {},
      previousStep: () => {},
      goToStep: () => {},
      toggleAutoPlay: () => {},
      currentSnapshot: null,
      hasWarnings: false,
    },
  };
}

describe("RecordingContext", () => {
  describe("when used inside RecordingProvider", () => {
    it("then provides value accessible to children via useRecordingContext", () => {
      const mockValue = makeMockValue();

      function Consumer() {
        const ctx = useRecordingContext();
        return <div data-testid="recording">{String(ctx.recordings.isRecording)}</div>;
      }

      render(
        <RecordingProvider value={mockValue}>
          <Consumer />
        </RecordingProvider>,
      );

      expect(screen.getByTestId("recording")).toHaveTextContent("false");
    });
  });

  describe("when used outside RecordingProvider", () => {
    it("then throws an error", () => {
      // Suppress console.error for expected throw
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useRecordingContext());
      }).toThrow("useRecordingContext must be used within RecordingProvider");

      spy.mockRestore();
    });
  });
});
