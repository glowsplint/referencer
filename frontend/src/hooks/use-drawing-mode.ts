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
  const [isDrawing, setIsDrawing] = useState(false)
  const isDrawingRef = useRef(false)
  const anchorRef = useRef<ArrowEndpoint | null>(null)
  const cursorRef = useRef<ArrowEndpoint | null>(null)

  // Keep refs in sync for keyup handler
  const activeLayerIdRef = useRef(activeLayerId)
  activeLayerIdRef.current = activeLayerId
  const addArrowRef = useRef(addArrow)
  addArrowRef.current = addArrow

  // Clear drawing state when unlocked
  useEffect(() => {
    if (!isLocked) {
      setDrawingState(null)
      setIsDrawing(false)
      isDrawingRef.current = false
      anchorRef.current = null
      cursorRef.current = null
    }
  }, [isLocked])

  // Update cursor when selection changes during drawing
  useEffect(() => {
    if (isDrawingRef.current && selection && anchorRef.current) {
      const cursor: ArrowEndpoint = {
        editorIndex: selection.editorIndex,
        from: selection.from,
        to: selection.to,
        text: selection.text,
      }
      cursorRef.current = cursor
      setDrawingState({
        anchor: anchorRef.current,
        cursor,
      })
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

      anchorRef.current = anchor
      cursorRef.current = anchor
      isDrawingRef.current = true
      setIsDrawing(true)
      setDrawingState({ anchor, cursor: anchor })
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "KeyA") return
      if (!isDrawingRef.current) return

      const anchor = anchorRef.current
      const cursor = cursorRef.current
      if (
        anchor &&
        cursor &&
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

      setDrawingState(null)
      setIsDrawing(false)
      isDrawingRef.current = false
      anchorRef.current = null
      cursorRef.current = null
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [isLocked, selection])

  return { drawingState, isDrawing }
}
