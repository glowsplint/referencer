import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import type { Arrow, ArrowEndpoint, DrawingState, WordSelection } from "@/types/editor"

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

  // Keep refs in sync for keyup handler
  const activeLayerIdRef = useRef(activeLayerId)
  activeLayerIdRef.current = activeLayerId
  const addArrowRef = useRef(addArrow)
  addArrowRef.current = addArrow

  // Clear drawing state when unlocked
  useEffect(() => {
    if (!isLocked) {
      setDrawingState(null)
      drawingRef.current = null
    }
  }, [isLocked])

  // Update cursor when selection changes during drawing
  useEffect(() => {
    if (drawingRef.current && selection) {
      const cursor: ArrowEndpoint = {
        editorIndex: selection.editorIndex,
        from: selection.from,
        to: selection.to,
        text: selection.text,
      }
      drawingRef.current = { anchor: drawingRef.current.anchor, cursor }
      setDrawingState(drawingRef.current)
    }
  }, [selection])

  useEffect(() => {
    if (!isLocked) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyA" || e.repeat) return
      if (!selection) return

      if (!activeLayerIdRef.current) {
        toast.warning("Add a new layer before drawing arrows")
        return
      }

      e.preventDefault()

      const anchor: ArrowEndpoint = {
        editorIndex: selection.editorIndex,
        from: selection.from,
        to: selection.to,
        text: selection.text,
      }

      drawingRef.current = { anchor, cursor: anchor }
      setDrawingState(drawingRef.current)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "KeyA") return
      if (!drawingRef.current) return

      const { anchor, cursor } = drawingRef.current
      if (
        activeLayerIdRef.current &&
        (anchor.editorIndex !== cursor.editorIndex ||
          anchor.from !== cursor.from ||
          anchor.to !== cursor.to)
      ) {
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
