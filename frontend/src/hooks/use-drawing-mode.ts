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
}

export function useDrawingMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addArrow,
}: UseDrawingModeOptions) {
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null)
  const anchorRef = useRef<ArrowEndpoint | null>(null)

  const activeLayerIdRef = useRef(activeLayerId)
  const addArrowRef = useRef(addArrow)
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId
    addArrowRef.current = addArrow
  })

  const isArrowTool = activeTool === "arrow" && isLocked

  // Clear anchor when switching away from arrow tool or unlocking
  if (!isArrowTool && anchorRef.current !== null) {
    anchorRef.current = null
    setDrawingState(null)
  }

  // Also clear state on render if not locked
  if (!isLocked && drawingState !== null) {
    setDrawingState(null)
  }

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
        return
      }

      if (sameWord(currentAnchor, endpoint)) {
        // Same word — cancel
        anchorRef.current = null
        setDrawingState(null)
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
    },
    []
  )

  const isDrawing = drawingState !== null

  return { drawingState, isDrawing, handleArrowClick }
}
