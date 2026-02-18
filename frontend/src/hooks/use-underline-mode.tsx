// Handles the "underline" annotation tool mode. Shows status prompts on entry,
// and on Enter creates an underline at the current word selection (or toggles
// it off if an identical range already exists).
import { useEffect, useRef, useCallback } from "react"
import { Trans } from "react-i18next"
import i18n from "@/i18n"
import { ToastKbd } from "@/components/ui/ToastKbd"
import type { ActiveTool, WordSelection, LayerUnderline } from "@/types/editor"
import type { StatusMessage } from "@/hooks/use-status-message"

interface UseUnderlineModeOptions {
  isLocked: boolean
  activeTool: ActiveTool
  selection: WordSelection | null
  activeLayerId: string | null
  addLayer: () => string
  layers: { id: string; underlines: LayerUnderline[] }[]
  addUnderline: (
    layerId: string,
    underline: Omit<LayerUnderline, "id">
  ) => string
  removeUnderline: (layerId: string, underlineId: string) => void
  showUnderlineToasts: boolean
  setStatus: (msg: StatusMessage) => void
  flashStatus: (msg: StatusMessage, duration: number) => void
  clearStatus: () => void
}

export function useUnderlineMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addLayer,
  layers,
  addUnderline,
  removeUnderline,
  showUnderlineToasts,
  setStatus,
  flashStatus,
  clearStatus,
}: UseUnderlineModeOptions) {
  const activeLayerIdRef = useRef(activeLayerId)
  const addLayerRef = useRef(addLayer)
  const addUnderlineRef = useRef(addUnderline)
  const removeUnderlineRef = useRef(removeUnderline)
  const layersRef = useRef(layers)
  const selectionRef = useRef(selection)

  useEffect(() => {
    activeLayerIdRef.current = activeLayerId
    addLayerRef.current = addLayer
    addUnderlineRef.current = addUnderline
    removeUnderlineRef.current = removeUnderline
    layersRef.current = layers
  }, [activeLayerId, addLayer, addUnderline, removeUnderline, layers])

  selectionRef.current = selection

  const activeToolRef = useRef(activeTool)
  activeToolRef.current = activeTool

  const isLockedRef = useRef(isLocked)
  isLockedRef.current = isLocked

  const showUnderlineToastsRef = useRef(showUnderlineToasts)
  showUnderlineToastsRef.current = showUnderlineToasts

  const setStatusRef = useRef(setStatus)
  setStatusRef.current = setStatus
  const flashStatusRef = useRef(flashStatus)
  flashStatusRef.current = flashStatus
  const clearStatusRef = useRef(clearStatus)
  clearStatusRef.current = clearStatus

  const isUnderlineTool = activeTool === "underline" && isLocked

  // Entry/exit effect
  useEffect(() => {
    if (isUnderlineTool) {
      if (showUnderlineToastsRef.current) {
        setStatusRef.current({ text: <Trans ns="tools" i18nKey="underline.selectWords" components={{ kbd: <ToastKbd>_</ToastKbd> }} />, type: "info" })
      }
    } else if (activeToolRef.current === "selection" || !isLockedRef.current) {
      clearStatusRef.current()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnderlineTool])

  const confirmUnderline = useCallback(() => {
    if (activeToolRef.current !== "underline" || !isLockedRef.current) return

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

    // Check for exact-match toggle (same range = remove existing underline)
    const existing = layer?.underlines.find(
      (u) => u.editorIndex === sel.editorIndex && u.from === sel.from && u.to === sel.to
    )
    if (existing) {
      removeUnderlineRef.current(layerId, existing.id)
      return
    }

    // Create underline
    addUnderlineRef.current(layerId, {
      editorIndex: sel.editorIndex,
      from: sel.from,
      to: sel.to,
      text: sel.text,
    })
    if (showUnderlineToastsRef.current) {
      flashStatusRef.current({ text: i18n.t("tools:underline.added"), type: "success" }, 1500)
    }
  }, [])

  return { confirmUnderline }
}
