import { useLayoutEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer } from "@/types/editor"

export interface HighlightPosition {
  highlightId: string
  layerId: string
  editorIndex: number
  top: number
  rightEdge: number
}

export function useAllHighlightPositions(
  editorsRef: React.RefObject<Map<number, Editor>>,
  layers: Layer[],
  containerRef: React.RefObject<HTMLDivElement | null>,
  sectionVisibility?: boolean[]
): HighlightPosition[] {
  const [positions, setPositions] = useState<HighlightPosition[]>([])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when no container
      setPositions([])
      return
    }

    function compute() {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const result: HighlightPosition[] = []

      for (const layer of layers) {
        if (!layer.visible) continue
        for (const highlight of layer.highlights) {
          if (sectionVisibility && sectionVisibility[highlight.editorIndex] === false) continue
          const editor = editorsRef.current.get(highlight.editorIndex)
          if (!editor || editor.isDestroyed) continue

          try {
            // Use domAtPos + Range for accurate viewport coordinates even when
            // scrolled out of view (coordsAtPos clamps to the visible editor area)
            const domStart = editor.view.domAtPos(highlight.from)
            const domEnd = editor.view.domAtPos(highlight.to)
            const range = document.createRange()
            range.setStart(domStart.node, domStart.offset)
            range.setEnd(domEnd.node, domEnd.offset)
            const rects = range.getClientRects()
            if (rects.length === 0) continue
            const firstRect = rects[0]
            const lastRect = rects[rects.length - 1]

            const top = firstRect.top - containerRect.top + container.scrollTop
            const rightEdge = lastRect.right - containerRect.left + container.scrollLeft

            result.push({
              highlightId: highlight.id,
              layerId: layer.id,
              editorIndex: highlight.editorIndex,
              top,
              rightEdge,
            })
          } catch {
            // Position may be invalid — skip
          }
        }
      }

      setPositions(result)
    }

    compute()

    // Listen to scroll events on each editor's wrapper element
    const scrollHandlers: { el: Element; handler: () => void }[] = []
    for (const [, editor] of editorsRef.current) {
      if (editor.isDestroyed) continue
      const editorDom = editor.view.dom
      const wrapper = editorDom.closest(".simple-editor-wrapper")
      if (wrapper) {
        const handler = () => compute()
        wrapper.addEventListener("scroll", handler, { passive: true })
        scrollHandlers.push({ el: wrapper, handler })
      }
    }

    return () => {
      for (const { el, handler } of scrollHandlers) {
        el.removeEventListener("scroll", handler)
      }
    }
  }, [editorsRef, layers, containerRef, sectionVisibility])

  return positions
}
