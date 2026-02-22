// Registers keyboard shortcuts for switching annotation tools when locked:
// S = selection, A = arrow, C = comments, H = highlight, U = underline, E = eraser.
// Only active when the editor is in locked (annotation) mode.
import { useEffect, useRef } from "react";
import { isEditableElement } from "@/lib/dom";
import type { ActiveTool } from "@/types/editor";

const KEY_MAP: Record<string, ActiveTool> = {
  KeyS: "selection",
  KeyA: "arrow",
  KeyC: "comments",
  KeyH: "highlight",
  KeyU: "underline",
  KeyE: "eraser",
};

interface UseToolShortcutsOptions {
  isLocked: boolean;
  setActiveTool: (tool: ActiveTool) => void;
}

export function useToolShortcuts({ isLocked, setActiveTool }: UseToolShortcutsOptions) {
  const setActiveToolRef = useRef(setActiveTool);
  useEffect(() => {
    setActiveToolRef.current = setActiveTool;
  });

  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (isEditableElement(e.target)) return;

      const tool = KEY_MAP[e.code];
      if (!tool) return;

      e.preventDefault();
      setActiveToolRef.current(tool);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLocked]);
}
