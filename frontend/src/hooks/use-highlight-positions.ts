import { useLayoutEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import type { Highlight } from "@/types/editor"

export interface HighlightPosition {
  highlightId: string
  layerId: string
  top: number
  rightEdge: number
}

export function useHighlightPositions(
  editor: Editor | null,
  highlights: { highlight: Highlight; layerId: string }[],
  wrapperRef: React.RefObject<HTMLDivElement | null>
): HighlightPosition[] {
  const [positions, setPositions] = useState<HighlightPosition[]>([])

  useLayoutEffect(() => {
    if (!editor || editor.isDestroyed || highlights.length === 0) {
      setPositions([])
      return
    }

    const wrapper = wrapperRef.current
    if (!wrapper) {
      setPositions([])
      return
    }

    const wrapperRect = wrapper.getBoundingClientRect()
    const result: HighlightPosition[] = []

    for (const { highlight, layerId } of highlights) {
      try {
        const coords = editor.view.coordsAtPos(highlight.from)
        const endCoords = editor.view.coordsAtPos(highlight.to)

        const top = coords.top - wrapperRect.top + wrapper.scrollTop
        const rightEdge = endCoords.right - wrapperRect.left + wrapper.scrollLeft

        result.push({
          highlightId: highlight.id,
          layerId,
          top,
          rightEdge,
        })
      } catch {
        // Position may be invalid — skip
      }
    }

    setPositions(result)
  }, [editor, highlights, wrapperRef])

  return positions
}
