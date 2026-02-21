// Binds Cmd+Z / Cmd+Shift+Z to undo/redo, but only when focus is
// not in an editable element (to avoid conflicting with native text undo).
import { useEffect } from "react";
import { isEditableElement } from "@/lib/dom";

interface UndoRedo {
  undo: () => void;
  redo: () => void;
}

export function useUndoRedoKeyboard(undoRedo: UndoRedo) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey || e.key.toLowerCase() !== "z") return;
      if (isEditableElement(e.target)) return;

      e.preventDefault();
      if (e.shiftKey) {
        undoRedo.redo();
      } else {
        undoRedo.undo();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [undoRedo]);
}
