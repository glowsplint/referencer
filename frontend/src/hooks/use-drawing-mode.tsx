// Manages the two-step arrow drawing workflow: first select an anchor word
// and press Enter, then select a target word and press Enter to create the arrow.
// Tracks drawing phase (idle -> selecting-anchor -> anchor-confirmed -> idle),
// provides a live preview via drawingState, and auto-creates a layer if needed.
import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import { Trans } from "react-i18next"
import i18n from "@/i18n"
import { ToastKbd } from "@/components/ui/ToastKbd"
import type { Arrow, ArrowEndpoint, ArrowStyle, DrawingState, DrawingPhase, WordSelection, ActiveTool } from "@/types/editor"
import type { StatusMessage } from "@/hooks/use-status-message"

function endpointFromSelection(sel: WordSelection): ArrowEndpoint {
  return {
    editorIndex: sel.editorIndex,
    from: sel.from,
    to: sel.to,
    text: sel.text,
  }
}

function sameEndpoint(a: ArrowEndpoint, b: ArrowEndpoint): boolean {
  return (
    a.editorIndex === b.editorIndex &&
    a.from === b.from &&
    a.to === b.to
  )
}

interface UseDrawingModeOptions {
  isLocked: boolean
  activeTool: ActiveTool
  selection: WordSelection | null
  activeLayerId: string | null
  activeArrowStyle: ArrowStyle
  addLayer: () => string
  addArrow: (layerId: string, arrow: Omit<Arrow, "id">) => void
  showDrawingToasts: boolean
  setStatus: (msg: StatusMessage) => void
  flashStatus: (msg: StatusMessage, duration: number) => void
  clearStatus: () => void
}

export function useDrawingMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  activeArrowStyle,
  addLayer,
  addArrow,
  showDrawingToasts,
  setStatus,
  flashStatus,
  clearStatus,
}: UseDrawingModeOptions) {
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null)
  const anchorRef = useRef<ArrowEndpoint | null>(null)
  const phaseRef = useRef<DrawingPhase>("idle")

  const activeLayerIdRef = useRef(activeLayerId)
  const addLayerRef = useRef(addLayer)
  const addArrowRef = useRef(addArrow)
  const activeArrowStyleRef = useRef(activeArrowStyle)
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId
    addLayerRef.current = addLayer
    addArrowRef.current = addArrow
    activeArrowStyleRef.current = activeArrowStyle
  }, [activeLayerId, addLayer, addArrow, activeArrowStyle])

  const showDrawingToastsRef = useRef(showDrawingToasts)
  showDrawingToastsRef.current = showDrawingToasts

  const setStatusRef = useRef(setStatus)
  setStatusRef.current = setStatus
  const flashStatusRef = useRef(flashStatus)
  flashStatusRef.current = flashStatus
  const clearStatusRef = useRef(clearStatus)
  clearStatusRef.current = clearStatus

  const activeToolRef = useRef(activeTool)
  activeToolRef.current = activeTool

  const isLockedRef = useRef(isLocked)
  isLockedRef.current = isLocked

  const isArrowTool = activeTool === "arrow" && isLocked

  const showInfo = (text: ReactNode) => {
    if (showDrawingToastsRef.current) {
      setStatusRef.current({ text, type: "info" })
    }
  }

  // Entry/exit effect: entering arrow mode → selecting-anchor; leaving → idle
  useEffect(() => {
    if (isArrowTool) {
      phaseRef.current = "selecting-anchor"
      showInfo(<Trans ns="tools" i18nKey="arrow.selectAnchor" components={{ kbd: <ToastKbd>_</ToastKbd> }} />)
    } else {
      const wasActive = phaseRef.current !== "idle"
      phaseRef.current = "idle"
      anchorRef.current = null
      setDrawingState(null)
      if (wasActive && (activeToolRef.current === "selection" || !isLockedRef.current)) {
        clearStatusRef.current()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isArrowTool])

  // Preview effect: update cursor during anchor-confirmed phase when selection changes
  useEffect(() => {
    if (phaseRef.current === "anchor-confirmed" && anchorRef.current && selection) {
      const cursor = endpointFromSelection(selection)
      setDrawingState({ anchor: anchorRef.current, cursor })
    }
  }, [selection])

  const selectionRef = useRef(selection)
  selectionRef.current = selection

  // Called when Enter is pressed with a valid selection
  const confirmSelection = useCallback(() => {
    const sel = selectionRef.current
    if (!sel) return

    const phase = phaseRef.current
    const endpoint = endpointFromSelection(sel)

    if (phase === "selecting-anchor") {
      // Auto-create a layer if none exists
      if (!activeLayerIdRef.current) {
        const id = addLayerRef.current()
        if (!id) return
        activeLayerIdRef.current = id
      }
      // Set anchor from selection
      anchorRef.current = endpoint
      phaseRef.current = "anchor-confirmed"
      setDrawingState({ anchor: endpoint, cursor: endpoint })
      showInfo(<Trans ns="tools" i18nKey="arrow.selectTarget" components={{ kbd: <ToastKbd>_</ToastKbd> }} />)
      return
    }

    if (phase === "anchor-confirmed") {
      const currentAnchor = anchorRef.current!

      if (sameEndpoint(currentAnchor, endpoint)) {
        // Same selection as anchor — revert to selecting-anchor
        anchorRef.current = null
        phaseRef.current = "selecting-anchor"
        setDrawingState(null)
        showInfo(<Trans ns="tools" i18nKey="arrow.selectAnchor" components={{ kbd: <ToastKbd>_</ToastKbd> }} />)
        return
      }

      // Different selection — create arrow, then reset to selecting-anchor
      if (activeLayerIdRef.current) {
        addArrowRef.current(activeLayerIdRef.current, {
          from: currentAnchor,
          to: endpoint,
          arrowStyle: activeArrowStyleRef.current,
        })
      }
      anchorRef.current = null
      phaseRef.current = "selecting-anchor"
      setDrawingState(null)
      if (showDrawingToastsRef.current) {
        flashStatusRef.current({ text: i18n.t("tools:arrow.created"), type: "success" }, 1500)
      }
      showInfo(<Trans ns="tools" i18nKey="arrow.selectAnchor" components={{ kbd: <ToastKbd>_</ToastKbd> }} />)
      return
    }
  }, [])

  const isDrawing = drawingState !== null

  return { drawingState, isDrawing, confirmSelection }
}
