import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { ToastKbd } from "@/components/ui/ToastKbd"
import type { Arrow, ArrowEndpoint, DrawingState, DrawingPhase, WordSelection, ActiveTool } from "@/types/editor"

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
  addArrow: (layerId: string, arrow: Omit<Arrow, "id">) => void
  showDrawingToasts: boolean
  setActiveTool: (tool: ActiveTool) => void
}

export function useDrawingMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addArrow,
  showDrawingToasts,
  setActiveTool,
}: UseDrawingModeOptions) {
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null)
  const anchorRef = useRef<ArrowEndpoint | null>(null)
  const phaseRef = useRef<DrawingPhase>("idle")

  const activeLayerIdRef = useRef(activeLayerId)
  const addArrowRef = useRef(addArrow)
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId
    addArrowRef.current = addArrow
  }, [activeLayerId, addArrow])

  const showDrawingToastsRef = useRef(showDrawingToasts)
  showDrawingToastsRef.current = showDrawingToasts

  const setActiveToolRef = useRef(setActiveTool)
  setActiveToolRef.current = setActiveTool

  const isArrowTool = activeTool === "arrow" && isLocked

  // Entry/exit effect: entering arrow mode → selecting-anchor; leaving → idle
  useEffect(() => {
    if (isArrowTool) {
      phaseRef.current = "selecting-anchor"
      if (showDrawingToastsRef.current) {
        toast.info(<>Select words for the anchor, then press <ToastKbd>Enter</ToastKbd></>, { id: "arrow-drawing" })
      }
    } else {
      const wasActive = phaseRef.current !== "idle"
      phaseRef.current = "idle"
      anchorRef.current = null
      setDrawingState(null)
      if (wasActive) {
        toast.dismiss("arrow-drawing")
      }
    }
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
      // Check for active layer first
      if (!activeLayerIdRef.current) {
        toast.warning("Add a new layer before drawing arrows")
        return
      }
      // Set anchor from selection
      anchorRef.current = endpoint
      phaseRef.current = "anchor-confirmed"
      setDrawingState({ anchor: endpoint, cursor: endpoint })
      if (showDrawingToastsRef.current) {
        toast.info(<>Now select the target and press <ToastKbd>Enter</ToastKbd></>, { id: "arrow-drawing" })
      }
      return
    }

    if (phase === "anchor-confirmed") {
      const currentAnchor = anchorRef.current!

      if (sameEndpoint(currentAnchor, endpoint)) {
        // Same selection as anchor — revert to selecting-anchor
        anchorRef.current = null
        phaseRef.current = "selecting-anchor"
        setDrawingState(null)
        if (showDrawingToastsRef.current) {
          toast.info(<>Select words for the anchor, then press <ToastKbd>Enter</ToastKbd></>, { id: "arrow-drawing" })
        }
        return
      }

      // Different selection — create arrow
      if (activeLayerIdRef.current) {
        addArrowRef.current(activeLayerIdRef.current, {
          from: currentAnchor,
          to: endpoint,
        })
      }
      anchorRef.current = null
      phaseRef.current = "idle"
      setDrawingState(null)
      if (showDrawingToastsRef.current) {
        toast.success("Arrow created", { id: "arrow-drawing", duration: 1500 })
      }
      setActiveToolRef.current("selection")
      return
    }
  }, [])

  const isDrawing = drawingState !== null

  return { drawingState, isDrawing, confirmSelection }
}
