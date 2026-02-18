// Handles the "eraser" annotation tool mode. When active, clicking on a word
// removes any overlapping highlights or underlines from visible layers.
import { useCallback, useEffect } from "react"
import i18n from "@/i18n"
import type { ActiveTool, Layer, WordSelection } from "@/types/editor"
import type { StatusMessage } from "./use-status-message"

interface UseEraserModeOptions {
  isLocked: boolean
  activeTool: ActiveTool
  selection: WordSelection | null
  layers: Layer[]
  removeHighlight: (layerId: string, highlightId: string) => void
  removeUnderline: (layerId: string, underlineId: string) => void
  setStatus: (msg: StatusMessage) => void
  flashStatus: (msg: StatusMessage, duration: number) => void
  clearStatus: () => void
}

export function useEraserMode({
  isLocked,
  activeTool,
  selection,
  layers,
  removeHighlight,
  removeUnderline,
  setStatus,
  flashStatus,
  clearStatus,
}: UseEraserModeOptions) {
  // Show status when eraser is active
  useEffect(() => {
    if (!isLocked || activeTool !== "eraser") return
    setStatus({ text: i18n.t("tools:eraser.status"), type: "info" })
    return () => clearStatus()
  }, [isLocked, activeTool, setStatus, clearStatus])

  const eraseAtPosition = useCallback((editorIndex: number, from: number, to: number) => {
    if (!isLocked || activeTool !== "eraser") return

    let erased = false

    for (const layer of layers) {
      if (!layer.visible) continue

      for (const highlight of layer.highlights) {
        if (
          highlight.editorIndex === editorIndex &&
          highlight.from < to &&
          highlight.to > from
        ) {
          removeHighlight(layer.id, highlight.id)
          erased = true
        }
      }

      for (const underline of layer.underlines) {
        if (
          underline.editorIndex === editorIndex &&
          underline.from < to &&
          underline.to > from
        ) {
          removeUnderline(layer.id, underline.id)
          erased = true
        }
      }
    }

    if (erased) {
      flashStatus({ text: i18n.t("tools:eraser.erased"), type: "success" }, 1500)
    }
  }, [isLocked, activeTool, layers, removeHighlight, removeUnderline, flashStatus])

  const confirmErase = useCallback(() => {
    if (!selection) return
    eraseAtPosition(selection.editorIndex, selection.from, selection.to)
  }, [selection, eraseAtPosition])

  return { confirmErase, eraseAtPosition }
}
