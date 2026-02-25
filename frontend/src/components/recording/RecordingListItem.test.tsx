import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { RecordingListItem } from "./RecordingListItem";
import { renderWithWorkspace } from "@/test/render-with-workspace";
import type { Recording } from "@/types/recording";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "recording.play": "Play",
        "recording.duplicateRecording": "Duplicate",
        "recording.deleteRecording": "Delete",
      };
      return map[key] ?? key;
    },
  }),
}));

const mockRecording: Recording = {
  id: "rec-1",
  name: "Test Recording",
  initialState: { layers: {}, annotations: {}, sections: {} },
  steps: [
    { id: "s1", delta: { "layer-1": true } },
    { id: "s2", delta: { "layer-2": false } },
  ],
  globalDelayMs: 500,
  transitionType: "instant",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function renderItem(overrides: Partial<Parameters<typeof RecordingListItem>[0]> = {}) {
  const props = {
    recording: mockRecording,
    onPlay: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    ...overrides,
  };
  renderWithWorkspace(<RecordingListItem {...props} />);
  return props;
}

describe("RecordingListItem", () => {
  describe("when rendered", () => {
    it("shows the recording name", () => {
      renderItem();
      expect(screen.getByText("Test Recording")).toBeInTheDocument();
    });

    it("shows the step count", () => {
      renderItem();
      expect(screen.getByText("2 steps")).toBeInTheDocument();
    });

    it("shows singular 'step' for 1 step", () => {
      renderItem({
        recording: {
          ...mockRecording,
          steps: [{ id: "s1", delta: {} }],
        },
      });
      expect(screen.getByText("1 step")).toBeInTheDocument();
    });
  });

  describe("when the play button is clicked", () => {
    it("calls onPlay with the recording ID", () => {
      const props = renderItem();
      fireEvent.click(screen.getByTestId("recordingPlay-rec-1"));
      expect(props.onPlay).toHaveBeenCalledWith("rec-1");
    });
  });

  describe("when the rename button is clicked", () => {
    it("enters rename mode with the current name", () => {
      renderItem();
      fireEvent.click(screen.getByTestId("recordingRenameBtn-rec-1"));
      expect(screen.getByTestId("recordingRenameInput-rec-1")).toHaveValue("Test Recording");
    });
  });

  describe("when renaming and Enter is pressed with a new name", () => {
    it("calls onRename with the recording ID and new name", () => {
      const props = renderItem();
      fireEvent.click(screen.getByTestId("recordingRenameBtn-rec-1"));
      const input = screen.getByTestId("recordingRenameInput-rec-1");
      fireEvent.change(input, { target: { value: "New Name" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(props.onRename).toHaveBeenCalledWith("rec-1", "New Name");
    });
  });

  describe("when renaming and Escape is pressed", () => {
    it("exits rename mode without calling onRename", () => {
      const props = renderItem();
      fireEvent.click(screen.getByTestId("recordingRenameBtn-rec-1"));
      const input = screen.getByTestId("recordingRenameInput-rec-1");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(props.onRename).not.toHaveBeenCalled();
      // Should show the name again (not the input)
      expect(screen.getByText("Test Recording")).toBeInTheDocument();
    });
  });

  describe("when the duplicate button is clicked", () => {
    it("calls onDuplicate with the recording ID", () => {
      const props = renderItem();
      fireEvent.click(screen.getByTestId("recordingDuplicateBtn-rec-1"));
      expect(props.onDuplicate).toHaveBeenCalledWith("rec-1");
    });
  });

  describe("when the delete button is clicked", () => {
    it("calls onDelete with the recording ID", () => {
      const props = renderItem();
      fireEvent.click(screen.getByTestId("recordingDeleteBtn-rec-1"));
      expect(props.onDelete).toHaveBeenCalledWith("rec-1");
    });
  });
});
