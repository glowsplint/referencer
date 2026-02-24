// Registers global keyboard shortcuts for toggling UI settings:
// D = dark mode, R = row/column layout, K = lock/unlock, M = management pane.
// All shortcuts are suppressed when focus is inside an editable element.
import { useEffect, useRef } from "react";
import { isEditableElement } from "@/lib/dom";

type ToggleAction = "darkMode" | "layout" | "lock" | "menu" | "commentPlacement";

const KEY_MAP: Record<string, ToggleAction> = {
  KeyD: "darkMode",
  KeyR: "layout",
  KeyK: "lock",
  KeyM: "menu",
  KeyP: "commentPlacement",
};

interface UseToggleShortcutsOptions {
  toggleDarkMode: () => void;
  toggleMultipleRowsLayout: () => void;
  toggleLocked: () => void;
  toggleManagementPane: () => void;
  toggleCommentPlacement: () => void;
}

export function useToggleShortcuts({
  toggleDarkMode,
  toggleMultipleRowsLayout,
  toggleLocked,
  toggleManagementPane,
  toggleCommentPlacement,
}: UseToggleShortcutsOptions) {
  const callbacksRef = useRef({
    toggleDarkMode,
    toggleMultipleRowsLayout,
    toggleLocked,
    toggleManagementPane,
    toggleCommentPlacement,
  });
  useEffect(() => {
    callbacksRef.current = {
      toggleDarkMode,
      toggleMultipleRowsLayout,
      toggleLocked,
      toggleManagementPane,
      toggleCommentPlacement,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      // Escape blurs editable elements so shortcuts like K work after
      if (e.code === "Escape" && isEditableElement(e.target)) {
        (document.activeElement as HTMLElement)?.blur?.();
        return;
      }

      const action = KEY_MAP[e.code];
      if (!action) return;

      if (isEditableElement(e.target)) return;

      e.preventDefault();
      const {
        toggleDarkMode,
        toggleMultipleRowsLayout,
        toggleLocked,
        toggleManagementPane,
        toggleCommentPlacement,
      } = callbacksRef.current;
      switch (action) {
        case "darkMode":
          toggleDarkMode();
          break;
        case "layout":
          toggleMultipleRowsLayout();
          break;
        case "lock":
          (document.activeElement as HTMLElement)?.blur?.();
          toggleLocked();
          break;
        case "menu":
          toggleManagementPane();
          break;
        case "commentPlacement":
          toggleCommentPlacement();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
