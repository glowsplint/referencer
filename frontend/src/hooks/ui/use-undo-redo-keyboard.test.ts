import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/dom", () => ({
  isEditableElement: vi.fn(() => false),
}));

import { useUndoRedoKeyboard } from "./use-undo-redo-keyboard";
import { isEditableElement } from "@/lib/dom";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isEditableElement).mockReturnValue(false);
});

describe("useUndoRedoKeyboard", () => {
  describe("when Cmd+Z is pressed", () => {
    it("calls undo", () => {
      const undoRedo = { undo: vi.fn(), redo: vi.fn() };
      renderHook(() => useUndoRedoKeyboard(undoRedo));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "z", metaKey: true, bubbles: true }),
        );
      });

      expect(undoRedo.undo).toHaveBeenCalledOnce();
      expect(undoRedo.redo).not.toHaveBeenCalled();
    });
  });

  describe("when Cmd+Shift+Z is pressed", () => {
    it("calls redo", () => {
      const undoRedo = { undo: vi.fn(), redo: vi.fn() };
      renderHook(() => useUndoRedoKeyboard(undoRedo));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "z",
            metaKey: true,
            shiftKey: true,
            bubbles: true,
          }),
        );
      });

      expect(undoRedo.redo).toHaveBeenCalledOnce();
      expect(undoRedo.undo).not.toHaveBeenCalled();
    });
  });

  describe("when Z is pressed without meta key", () => {
    it("does not call undo or redo", () => {
      const undoRedo = { undo: vi.fn(), redo: vi.fn() };
      renderHook(() => useUndoRedoKeyboard(undoRedo));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", bubbles: true }));
      });

      expect(undoRedo.undo).not.toHaveBeenCalled();
      expect(undoRedo.redo).not.toHaveBeenCalled();
    });
  });

  describe("when a different key is pressed with meta", () => {
    it("does not call undo or redo", () => {
      const undoRedo = { undo: vi.fn(), redo: vi.fn() };
      renderHook(() => useUndoRedoKeyboard(undoRedo));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "a", metaKey: true, bubbles: true }),
        );
      });

      expect(undoRedo.undo).not.toHaveBeenCalled();
      expect(undoRedo.redo).not.toHaveBeenCalled();
    });
  });

  describe("when focus is in an editable element", () => {
    it("does not call undo or redo", () => {
      vi.mocked(isEditableElement).mockReturnValue(true);
      const undoRedo = { undo: vi.fn(), redo: vi.fn() };
      renderHook(() => useUndoRedoKeyboard(undoRedo));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "z", metaKey: true, bubbles: true }),
        );
      });

      expect(undoRedo.undo).not.toHaveBeenCalled();
      expect(undoRedo.redo).not.toHaveBeenCalled();
    });
  });

  describe("when the hook unmounts", () => {
    it("removes the event listener", () => {
      const undoRedo = { undo: vi.fn(), redo: vi.fn() };
      const { unmount } = renderHook(() => useUndoRedoKeyboard(undoRedo));

      unmount();

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "z", metaKey: true, bubbles: true }),
        );
      });

      expect(undoRedo.undo).not.toHaveBeenCalled();
    });
  });
});
