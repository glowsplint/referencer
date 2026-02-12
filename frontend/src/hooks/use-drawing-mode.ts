import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import type { Arrow, ArrowEndpoint, DrawingState, WordSelection, ActiveTool } from "@/types/editor"

function endpointFromSelection(sel: WordSelection): ArrowEndpoint {
  return {
    editorIndex: sel.editorIndex,
    from: sel.from,
    to: sel.to,
    text: sel.text,
  }
}

function sameWord(a: ArrowEndpoint, b: ArrowEndpoint): boolean {
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
}

export function useDrawingMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addArrow,
  showDrawingToasts,
}: UseDrawingModeOptions) {
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null)
  const anchorRef = useRef<ArrowEndpoint | null>(null)

  const activeLayerIdRef = useRef(activeLayerId)
  const addArrowRef = useRef(addArrow)
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId
    addArrowRef.current = addArrow
  }, [activeLayerId, addArrow])

  const showDrawingToastsRef = useRef(showDrawingToasts)
  showDrawingToastsRef.current = showDrawingToasts

  const isArrowTool = activeTool === "arrow" && isLocked
  const isArrowToolRef = useRef(isArrowTool)
  isArrowToolRef.current = isArrowTool

  // Clear anchor when switching away from arrow tool or unlocking
  useEffect(() => {
    if (!isArrowTool) {
      anchorRef.current = null
      setDrawingState(null)
      toast.dismiss("arrow-drawing")
    }
  }, [isArrowTool])

  // Update preview cursor when selection changes while anchor is set
  useEffect(() => {
    if (anchorRef.current && selection) {
      const cursor = endpointFromSelection(selection)
      setDrawingState({ anchor: anchorRef.current, cursor })
    }
  }, [selection])

  // Called when user explicitly clicks a word while in arrow mode
  const handleArrowClick = useCallback(
    (sel: WordSelection) => {
      if (!isArrowToolRef.current) return

      const endpoint = endpointFromSelection(sel)
      const currentAnchor = anchorRef.current

      if (!currentAnchor) {
        // No anchor — check for active layer first
        if (!activeLayerIdRef.current) {
          toast.warning("Add a new layer before drawing arrows")
          return
        }
        // Set anchor from click
        anchorRef.current = endpoint
        setDrawingState({ anchor: endpoint, cursor: endpoint })
        if (showDrawingToastsRef.current) toast.info("Now click the target word", { id: "arrow-drawing" })
        return
      }

      if (sameWord(currentAnchor, endpoint)) {
        // Same word — cancel
        anchorRef.current = null
        setDrawingState(null)
        toast.dismiss("arrow-drawing")
        return
      }

      // Different word — create arrow
      if (activeLayerIdRef.current) {
        addArrowRef.current(activeLayerIdRef.current, {
          from: currentAnchor,
          to: endpoint,
        })
      }
      anchorRef.current = null
      setDrawingState(null)
      if (showDrawingToastsRef.current) toast.success("Arrow created", { id: "arrow-drawing", duration: 1500 })
    },
    []
  )

  const isDrawing = drawingState !== null

  return { drawingState, isDrawing, handleArrowClick }
}
