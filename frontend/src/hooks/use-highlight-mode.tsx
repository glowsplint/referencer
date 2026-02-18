// Handles the "highlight" annotation tool mode. Shows status prompts on entry,
// and on Enter creates a highlight at the current word selection (or toggles
// it off if an identical range already exists with no annotation).
import { useEffect, useRef, useCallback } from "react"
import { Trans } from "react-i18next"
import i18n from "@/i18n"
import { ToastKbd } from "@/components/ui/ToastKbd"
import type { ActiveTool, WordSelection } from "@/types/editor"
import { FLASH_DURATION_MS, type StatusMessage } from "@/hooks/use-status-message"
import { useLatestRef } from "@/hooks/use-latest-ref"

interface UseHighlightModeOptions {
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
  showHighlightToasts: boolean
  setStatus: (msg: StatusMessage) => void
  flashStatus: (msg: StatusMessage, duration: number) => void
  clearStatus: () => void
}

export function useHighlightMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addLayer,
  layers,
  addHighlight,
  removeHighlight,
  showHighlightToasts,
  setStatus,
  flashStatus,
  clearStatus,
}: UseHighlightModeOptions) {
  // activeLayerIdRef uses useEffect sync (not useLatestRef) because confirmHighlight
  // writes to it locally after auto-creating a layer — the local value must persist
  // until the parent passes down a new activeLayerId prop
  const activeLayerIdRef = useRef(activeLayerId)
  useEffect(() => { activeLayerIdRef.current = activeLayerId }, [activeLayerId])
  const addLayerRef = useLatestRef(addLayer)
  const addHighlightRef = useLatestRef(addHighlight)
  const removeHighlightRef = useLatestRef(removeHighlight)
  const layersRef = useLatestRef(layers)
  const selectionRef = useLatestRef(selection)

  const activeToolRef = useLatestRef(activeTool)
  const isLockedRef = useLatestRef(isLocked)

  const showHighlightToastsRef = useLatestRef(showHighlightToasts)

  const setStatusRef = useLatestRef(setStatus)
  const flashStatusRef = useLatestRef(flashStatus)
  const clearStatusRef = useLatestRef(clearStatus)

  const isHighlightTool = activeTool === "highlight" && isLocked

  // Entry/exit effect
  useEffect(() => {
    if (isHighlightTool) {
      if (showHighlightToastsRef.current) {
        setStatusRef.current({ text: <Trans ns="tools" i18nKey="highlight.selectWords" components={{ kbd: <ToastKbd>_</ToastKbd> }} />, type: "info" })
      }
    } else if (activeToolRef.current === "selection" || !isLockedRef.current) {
      clearStatusRef.current()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHighlightTool])

  const confirmHighlight = useCallback(() => {
    if (activeToolRef.current !== "highlight" || !isLockedRef.current) return

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

    // Check for exact-match toggle (same range = remove existing highlight)
    const existing = layer?.highlights.find(
      (h) =>
        h.editorIndex === sel.editorIndex &&
        h.from === sel.from &&
        h.to === sel.to &&
        !h.annotation.trim()
    )
    if (existing) {
      removeHighlightRef.current(layerId, existing.id)
      if (showHighlightToastsRef.current) {
flashStatusRef.current({ text: i18n.t("tools:highlight.removed"), type: "success" }, FLASH_DURATION_MS)
      }
      return
    }

    // Create highlight with empty annotation
    addHighlightRef.current(layerId, {
      editorIndex: sel.editorIndex,
      from: sel.from,
      to: sel.to,
      text: sel.text,
      annotation: "",
      type: "highlight",
    })
    if (showHighlightToastsRef.current) {
flashStatusRef.current({ text: i18n.t("tools:highlight.added"), type: "success" }, FLASH_DURATION_MS)
    }
    // Stay in highlight mode — do NOT switch to selection tool
  }, [])

  return { confirmHighlight }
}
