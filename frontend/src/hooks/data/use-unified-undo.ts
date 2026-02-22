// Unified undo/redo controller that merges Yjs UndoManager with the
// command-pattern action history. Yjs undo takes priority (most recent
// CRDT changes), falling back to action history for non-CRDT operations.
import { useCallback, useMemo } from "react";
import type { useYjsUndo } from "./use-yjs-undo";
import type { useActionHistory } from "./use-action-history";

type YjsUndo = ReturnType<typeof useYjsUndo>;
type History = ReturnType<typeof useActionHistory>;

export function useUnifiedUndo(yjsUndo: YjsUndo, history: History) {
  const undo = useCallback(() => {
    if (yjsUndo.canUndo) {
      yjsUndo.undo();
      // Sync the action console log: mark the most recent entry as undone
      // so it shows line-through styling even when Yjs handled the undo
      history.markLastUndone();
    } else if (history.canUndo) {
      history.undo();
    }
  }, [yjsUndo, history]);

  const redo = useCallback(() => {
    if (yjsUndo.canRedo) {
      yjsUndo.redo();
      // Sync the action console log: restore the most recent undone entry
      history.markLastRedone();
    } else if (history.canRedo) {
      history.redo();
    }
  }, [yjsUndo, history]);

  const canUndo = yjsUndo.canUndo || history.canUndo;
  const canRedo = yjsUndo.canRedo || history.canRedo;

  return useMemo(() => ({ undo, redo, canUndo, canRedo }), [undo, redo, canUndo, canRedo]);
}
