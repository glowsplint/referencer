// Handles the "comments" annotation tool mode. Shows status prompts on entry,
// and on Enter creates a comment highlight at the current word selection
// (or toggles it off if one already exists at that range).
// Refs are used extensively to keep the confirmComment callback stable.
import { useEffect, useRef, useCallback } from "react"
import { Trans } from "react-i18next"
import i18n from "@/i18n"
import { ToastKbd } from "@/components/ui/ToastKbd"
import type { ActiveTool, WordSelection } from "@/types/editor"
import { FLASH_DURATION_MS, type StatusMessage } from "@/hooks/use-status-message"
import { useLatestRef } from "@/hooks/use-latest-ref"

interface UseCommentModeOptions {
  isLocked: boolean
  activeTool: ActiveTool
  selection: WordSelection | null
  activeLayerId: string | null
  addLayer: () => string
  layers: { id: string; highlights: { id: string; editorIndex: number; from: number; to: number; annotation: string; type: "highlight" | "comment" }[] }[]
  addHighlight: (
    layerId: string,
    highlight: { editorIndex: number; from: number; to: number; text: string; annotation: string; type: "highlight" | "comment" }
  ) => string
  removeHighlight: (layerId: string, highlightId: string) => void
  onHighlightAdded?: (layerId: string, highlightId: string) => void
  showCommentToasts: boolean
  setStatus: (msg: StatusMessage) => void
  flashStatus: (msg: StatusMessage, duration: number) => void
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
  flashStatus,
  clearStatus,
}: UseCommentModeOptions) {
  // activeLayerIdRef uses useEffect sync (not useLatestRef) because confirmComment
  // writes to it locally after auto-creating a layer — the local value must persist
  // until the parent passes down a new activeLayerId prop
  const activeLayerIdRef = useRef(activeLayerId)
  useEffect(() => { activeLayerIdRef.current = activeLayerId }, [activeLayerId])
  const addLayerRef = useLatestRef(addLayer)
  const addHighlightRef = useLatestRef(addHighlight)
  const removeHighlightRef = useLatestRef(removeHighlight)
  const layersRef = useLatestRef(layers)
  const onHighlightAddedRef = useLatestRef(onHighlightAdded)
  const selectionRef = useLatestRef(selection)

  const activeToolRef = useLatestRef(activeTool)
  const isLockedRef = useLatestRef(isLocked)

  const showCommentToastsRef = useLatestRef(showCommentToasts)

  const setStatusRef = useLatestRef(setStatus)
  const flashStatusRef = useLatestRef(flashStatus)
  const clearStatusRef = useLatestRef(clearStatus)

  const isCommentTool = activeTool === "comments" && isLocked

  // Entry/exit effect
  useEffect(() => {
    if (isCommentTool) {
      if (showCommentToastsRef.current) {
        setStatusRef.current({ text: <Trans ns="tools" i18nKey="comments.selectWords" components={{ kbd: <ToastKbd>_</ToastKbd> }} />, type: "info" })
      }
    } else if (activeToolRef.current === "selection" || !isLockedRef.current) {
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

    // Remove any existing empty-annotation comments on this layer (not pure highlights)
    if (layer) {
      for (const h of layer.highlights) {
        if (h.type === "comment" && !h.annotation.trim()) {
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

    // Create comment with empty annotation
    const highlightId = addHighlightRef.current(layerId, {
      editorIndex: sel.editorIndex,
      from: sel.from,
      to: sel.to,
      text: sel.text,
      annotation: "",
      type: "comment",
    })
    if (showCommentToastsRef.current) {
flashStatusRef.current({ text: i18n.t("tools:comments.added"), type: "success" }, FLASH_DURATION_MS)
    }
    onHighlightAddedRef.current?.(layerId, highlightId)
    // Keep selection so user can continue keyboard navigation after Escape
    // Stay in comments mode — do NOT switch to selection tool
  }, [])

  return { confirmComment }
}
