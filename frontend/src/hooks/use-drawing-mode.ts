import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import type { Arrow, ArrowEndpoint, DrawingState, WordSelection } from "@/types/editor"

const DRAW_ARROW_KEY = "KeyA"

function endpointFromSelection(sel: WordSelection): ArrowEndpoint {
  return {
    editorIndex: sel.editorIndex,
    from: sel.from,
    to: sel.to,
    text: sel.text,
  }
}

function arrowSpansDifferentWords(anchor: ArrowEndpoint, cursor: ArrowEndpoint): boolean {
  return (
    anchor.editorIndex !== cursor.editorIndex ||
    anchor.from !== cursor.from ||
    anchor.to !== cursor.to
  )
}

interface UseDrawingModeOptions {
  isLocked: boolean
  selection: WordSelection | null
  activeLayerId: string | null
  addArrow: (layerId: string, arrow: Omit<Arrow, "id">) => void
}

export function useDrawingMode({
  isLocked,
  selection,
  activeLayerId,
  addArrow,
}: UseDrawingModeOptions) {
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null)
  const drawingRef = useRef<DrawingState | null>(null)

  const activeLayerIdRef = useRef(activeLayerId)
  const addArrowRef = useRef(addArrow)
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId
    addArrowRef.current = addArrow
  })

  // Clear drawing state when unlocked (render-time state adjustment avoids cascading effect renders)
  if (!isLocked && drawingState !== null) {
    setDrawingState(null)
  }

  // Clear ref in effect (ref updates belong in effects, not render)
  useEffect(() => {
    if (!isLocked) {
      drawingRef.current = null
    }
  }, [isLocked])

  useEffect(() => {
    if (drawingRef.current && selection) {
      const cursor = endpointFromSelection(selection)
      drawingRef.current = { anchor: drawingRef.current.anchor, cursor }
      setDrawingState(drawingRef.current)
    }
  }, [selection])

  useEffect(() => {
    if (!isLocked) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== DRAW_ARROW_KEY || e.repeat) return
      if (!selection) return

      if (!activeLayerIdRef.current) {
        toast.warning("Add a new layer before drawing arrows")
        return
      }

      e.preventDefault()

      const anchor = endpointFromSelection(selection)
      drawingRef.current = { anchor, cursor: anchor }
      setDrawingState(drawingRef.current)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== DRAW_ARROW_KEY) return
      if (!drawingRef.current) return

      const { anchor, cursor } = drawingRef.current
      if (activeLayerIdRef.current && arrowSpansDifferentWords(anchor, cursor)) {
        addArrowRef.current(activeLayerIdRef.current, {
          from: anchor,
          to: cursor,
        })
      }

      drawingRef.current = null
      setDrawingState(null)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [isLocked, selection])

  const isDrawing = drawingState !== null

  return { drawingState, isDrawing }
}
