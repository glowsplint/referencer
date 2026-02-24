// Manages automatic status bar hint messages based on editor state:
// - Lock hint when the editor is unlocked
// - Default selection status when locked with selection tool
// - Clearing arrow selection when a word selection becomes visible

import { useEffect } from "react";
import { Trans } from "react-i18next";
import { ToastKbd } from "@/components/ui/ToastKbd";
import type { ActiveTool, WordSelection } from "@/types/editor";
import type { StatusMessage } from "./use-status-message";

interface UseStatusHintsArgs {
  isLocked: boolean;
  effectiveReadOnly: boolean;
  activeTool: ActiveTool;
  selection: WordSelection | null;
  selectionHidden: boolean;
  setStatus: (msg: StatusMessage) => void;
  setSelectedArrow: (arrow: null) => void;
  isRecording: boolean;
}

export function useStatusHints({
  isLocked,
  effectiveReadOnly,
  activeTool,
  selection,
  selectionHidden,
  setStatus,
  setSelectedArrow,
  isRecording,
}: UseStatusHintsArgs) {
  // Hint to lock the editor when unlocked
  useEffect(() => {
    if (!isLocked && !effectiveReadOnly) {
      setStatus({
        text: <Trans ns="tools" i18nKey="lockHint" components={{ kbd: <ToastKbd>_</ToastKbd> }} />,
        type: "info",
      });
    }
  }, [isLocked, effectiveReadOnly, setStatus]);

  // Default status message when locked with selection tool and no visible selection
  useEffect(() => {
    if (isLocked && activeTool === "selection" && (!selection || selectionHidden)) {
      setStatus({ text: <Trans ns="tools" i18nKey="selection.defaultStatus" />, type: "info" });
    }
  }, [isLocked, activeTool, selection, selectionHidden, setStatus]);

  // Mutual exclusivity: visible word selection clears arrow selection
  useEffect(() => {
    if (selection && !selectionHidden) {
      setSelectedArrow(null);
    }
  }, [selection, selectionHidden, setSelectedArrow]);

  // Hint during recording
  useEffect(() => {
    if (isRecording) {
      setStatus({
        text: <Trans ns="tools" i18nKey="recording.statusHint" />,
        type: "info",
      });
    }
  }, [isRecording, setStatus]);
}
