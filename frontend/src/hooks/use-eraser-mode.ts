import { useCallback, useEffect } from "react"
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
  clearStatus,
}: UseEraserModeOptions) {
  // Show status when eraser is active
  useEffect(() => {
    if (!isLocked || activeTool !== "eraser") return
    setStatus({ text: "Click on a highlight or underline to erase it", type: "info" })
    return () => clearStatus()
  }, [isLocked, activeTool, setStatus, clearStatus])

  const confirmErase = useCallback(() => {
    if (!isLocked || activeTool !== "eraser" || !selection) return

    const { editorIndex, from, to } = selection
    let erased = false

    // Check visible layers for overlapping highlights and underlines
    for (const layer of layers) {
      if (!layer.visible) continue

      // Find highlights that overlap with the selection
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

      // Find underlines that overlap with the selection
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
      setStatus({ text: "Erased decoration", type: "success" })
    }
  }, [isLocked, activeTool, selection, layers, removeHighlight, removeUnderline, setStatus])

  return { confirmErase }
}
