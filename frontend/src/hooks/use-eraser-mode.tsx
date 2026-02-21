// Handles the "eraser" annotation tool mode. When active, clicking on a word
// removes any overlapping highlights, underlines, or arrows from visible layers.
import { useCallback, useEffect } from "react";
import { Trans } from "react-i18next";
import type { ActiveTool, Layer, WordSelection } from "@/types/editor";
import { FLASH_DURATION_MS, type StatusMessage } from "./use-status-message";

interface UseEraserModeOptions {
  isLocked: boolean;
  activeTool: ActiveTool;
  selection: WordSelection | null;
  layers: Layer[];
  removeHighlight: (layerId: string, highlightId: string) => void;
  removeUnderline: (layerId: string, underlineId: string) => void;
  removeArrow: (layerId: string, arrowId: string) => void;
  setStatus: (msg: StatusMessage) => void;
  flashStatus: (msg: StatusMessage, duration: number) => void;
  clearStatus: () => void;
}

export function useEraserMode({
  isLocked,
  activeTool,
  selection,
  layers,
  removeHighlight,
  removeUnderline,
  removeArrow,
  setStatus,
  flashStatus,
  clearStatus,
}: UseEraserModeOptions) {
  // Show status when eraser is active
  useEffect(() => {
    if (!isLocked || activeTool !== "eraser") return;
    setStatus({ text: <Trans ns="tools" i18nKey="eraser.status" />, type: "info" });
    return () => clearStatus();
  }, [isLocked, activeTool, setStatus, clearStatus]);

  const eraseAtPosition = useCallback(
    (editorIndex: number, from: number, to: number) => {
      if (!isLocked || activeTool !== "eraser") return;

      let erased = false;

      for (const layer of layers) {
        if (!layer.visible) continue;

        for (const highlight of layer.highlights) {
          if (highlight.editorIndex === editorIndex && highlight.from < to && highlight.to > from) {
            removeHighlight(layer.id, highlight.id);
            erased = true;
          }
        }

        for (const underline of layer.underlines) {
          if (underline.editorIndex === editorIndex && underline.from < to && underline.to > from) {
            removeUnderline(layer.id, underline.id);
            erased = true;
          }
        }

        for (const arrow of layer.arrows) {
          const fromMatch =
            arrow.from.editorIndex === editorIndex && arrow.from.from < to && arrow.from.to > from;
          const toMatch =
            arrow.to.editorIndex === editorIndex && arrow.to.from < to && arrow.to.to > from;
          if (fromMatch || toMatch) {
            removeArrow(layer.id, arrow.id);
            erased = true;
          }
        }
      }

      if (erased) {
        flashStatus(
          { text: <Trans ns="tools" i18nKey="eraser.erased" />, type: "success" },
          FLASH_DURATION_MS,
        );
      }
    },
    [isLocked, activeTool, layers, removeHighlight, removeUnderline, removeArrow, flashStatus],
  );

  const confirmErase = useCallback(() => {
    if (!selection) return;
    eraseAtPosition(selection.editorIndex, selection.from, selection.to);
  }, [selection, eraseAtPosition]);

  return { confirmErase, eraseAtPosition };
}
