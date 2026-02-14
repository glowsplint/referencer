import { useEffect, useRef, useCallback } from "react"
import { ToastKbd } from "@/components/ui/ToastKbd"
import type { ActiveTool, WordSelection } from "@/types/editor"
import type { StatusMessage } from "@/hooks/use-status-message"

interface UseCommentModeOptions {
  isLocked: boolean
  activeTool: ActiveTool
  selection: WordSelection | null
  activeLayerId: string | null
  addLayer: () => string
  layers: { id: string; highlights: { id: string; editorIndex: number; from: number; to: number; annotation: string }[] }[]
  addHighlight: (
    layerId: string,
    highlight: { editorIndex: number; from: number; to: number; text: string; annotation: string }
  ) => string
  removeHighlight: (layerId: string, highlightId: string) => void
  onHighlightAdded?: (layerId: string, highlightId: string) => void
  showCommentToasts: boolean
  setStatus: (msg: StatusMessage, duration?: number) => void
  clearStatus: () => void
}

export function useCommentMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addLayer,
  layers,
  addHighlight,
  removeHighlight,
  onHighlightAdded,
  showCommentToasts,
  setStatus,
  clearStatus,
}: UseCommentModeOptions) {
  const activeLayerIdRef = useRef(activeLayerId)
  const addLayerRef = useRef(addLayer)
  const addHighlightRef = useRef(addHighlight)
  const removeHighlightRef = useRef(removeHighlight)
  const layersRef = useRef(layers)
  const onHighlightAddedRef = useRef(onHighlightAdded)
  const selectionRef = useRef(selection)

  useEffect(() => {
    activeLayerIdRef.current = activeLayerId
    addLayerRef.current = addLayer
    addHighlightRef.current = addHighlight
    removeHighlightRef.current = removeHighlight
    layersRef.current = layers
    onHighlightAddedRef.current = onHighlightAdded
  }, [activeLayerId, addLayer, addHighlight, removeHighlight, layers, onHighlightAdded])

  selectionRef.current = selection

  const activeToolRef = useRef(activeTool)
  activeToolRef.current = activeTool

  const isLockedRef = useRef(isLocked)
  isLockedRef.current = isLocked

  const showCommentToastsRef = useRef(showCommentToasts)
  showCommentToastsRef.current = showCommentToasts

  const setStatusRef = useRef(setStatus)
  setStatusRef.current = setStatus
  const clearStatusRef = useRef(clearStatus)
  clearStatusRef.current = clearStatus

  const isCommentTool = activeTool === "comments" && isLocked

  // Entry/exit effect
  useEffect(() => {
    if (isCommentTool) {
      if (showCommentToastsRef.current) {
        setStatusRef.current({ text: <>Select words, then press <ToastKbd>Enter</ToastKbd></>, type: "info" })
      }
    } else {
      clearStatusRef.current()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommentTool])

  const confirmComment = useCallback(() => {
    if (activeToolRef.current !== "comments" || !isLockedRef.current) return

    const sel = selectionRef.current
    if (!sel) return

    let layerId = activeLayerIdRef.current
    if (!layerId) {
      const id = addLayerRef.current()
      if (!id) return
      layerId = id
      activeLayerIdRef.current = id
    }

    const layer = layersRef.current.find((l) => l.id === layerId)

    // Remove any existing empty-annotation highlights on this layer
    if (layer) {
      for (const h of layer.highlights) {
        if (!h.annotation.trim()) {
          removeHighlightRef.current(layerId, h.id)
        }
      }
    }

    // Check for exact-match toggle (same range = remove existing highlight)
    const existing = layer?.highlights.find(
      (h) => h.editorIndex === sel.editorIndex && h.from === sel.from && h.to === sel.to
    )
    if (existing) {
      removeHighlightRef.current(layerId, existing.id)
      return
    }

    // Create highlight with empty annotation
    const highlightId = addHighlightRef.current(layerId, {
      editorIndex: sel.editorIndex,
      from: sel.from,
      to: sel.to,
      text: sel.text,
      annotation: "",
    })
    if (showCommentToastsRef.current) {
      setStatusRef.current({ text: "Comment added", type: "success" }, 1500)
    }
    onHighlightAddedRef.current?.(layerId, highlightId)
    // Keep selection so user can continue keyboard navigation after Escape
    // Stay in comments mode — do NOT switch to selection tool
  }, [])

  return { confirmComment }
}
