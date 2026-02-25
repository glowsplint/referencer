import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUndoRedoKeyboard } from "./use-undo-redo-keyboard";

function fireKeyDown(key: string, options: Partial<KeyboardEvent> = {}) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
}

describe("useUndoRedoKeyboard", () => {
  it("when Cmd+Z is pressed, then calls undo", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() => useUndoRedoKeyboard({ undo, redo }));

    fireKeyDown("z", { metaKey: true });
    expect(undo).toHaveBeenCalledOnce();
    expect(redo).not.toHaveBeenCalled();
  });

  it("when Cmd+Shift+Z is pressed, then calls redo", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() => useUndoRedoKeyboard({ undo, redo }));

    fireKeyDown("z", { metaKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledOnce();
    expect(undo).not.toHaveBeenCalled();
  });

  it("when Z is pressed without meta key, then ignores it", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() => useUndoRedoKeyboard({ undo, redo }));

    fireKeyDown("z");
    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });

  it("when focus is in an editable element, then ignores the shortcut", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() => useUndoRedoKeyboard({ undo, redo }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "z", metaKey: true, bubbles: true }));
    document.body.removeChild(input);

    expect(undo).not.toHaveBeenCalled();
  });

  it("when focus is in a textarea, then ignores the shortcut", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() => useUndoRedoKeyboard({ undo, redo }));

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", metaKey: true, bubbles: true }),
    );
    document.body.removeChild(textarea);

    expect(undo).not.toHaveBeenCalled();
  });
});
