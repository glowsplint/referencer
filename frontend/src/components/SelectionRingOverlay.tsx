import { useLayoutEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"

interface OverlayRect {
  top: number
  left: number
  width: number
  height: number
}

const LINE_MERGE_THRESHOLD = 2
const PADDING_X = 2
const PADDING_Y = 1

function getSelectionRects(
  editor: Editor,
  selection: WordSelection,
  wrapper: HTMLElement
): OverlayRect[] {
  const domStart = editor.view.domAtPos(selection.from)
  const domEnd = editor.view.domAtPos(selection.to)

  const range = document.createRange()
  range.setStart(domStart.node, domStart.offset)
  range.setEnd(domEnd.node, domEnd.offset)

  const clientRects = range.getClientRects()
  if (clientRects.length === 0) return []

  const wrapperRect = wrapper.getBoundingClientRect()

  // Convert to wrapper-relative coords (accounting for scroll)
  const rects: OverlayRect[] = []
  for (const cr of clientRects) {
    if (cr.width === 0) continue
    rects.push({
      top: cr.top - wrapperRect.top + wrapper.scrollTop,
      left: cr.left - wrapperRect.left + wrapper.scrollLeft,
      width: cr.width,
      height: cr.height,
    })
  }

  // Merge rects on the same line
  const merged: OverlayRect[] = []
  for (const rect of rects) {
    const last = merged[merged.length - 1]
    if (last && Math.abs(rect.top - last.top) < LINE_MERGE_THRESHOLD) {
      const newLeft = Math.min(last.left, rect.left)
      const newRight = Math.max(last.left + last.width, rect.left + rect.width)
      last.left = newLeft
      last.width = newRight - newLeft
      last.height = Math.max(last.height, rect.height)
    } else {
      merged.push({ ...rect })
    }
  }

  return merged
}

export function SelectionRingOverlay({
  editor,
  selection,
  editorIndex,
  isLocked,
  isDarkMode,
  wrapperRef,
}: {
  editor: Editor | null
  selection: WordSelection | null
  editorIndex: number
  isLocked: boolean
  isDarkMode: boolean
  wrapperRef: React.RefObject<HTMLDivElement | null>
}) {
  const [rects, setRects] = useState<OverlayRect[]>([])

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (
      !editor ||
      editor.isDestroyed ||
      !isLocked ||
      !selection ||
      selection.editorIndex !== editorIndex ||
      !wrapper
    ) {
      setRects([])
      return
    }

    try {
      setRects(getSelectionRects(editor, selection, wrapper))
    } catch {
      setRects([])
    }
  }, [editor, selection, editorIndex, isLocked, wrapperRef])

  if (rects.length === 0) return null

  const ringColor = isDarkMode ? "#60a5fa" : "#3b82f6"
  const glowColor = isDarkMode ? "#60a5fa30" : "#3b82f630"

  return (
    <>
      {rects.map((rect, i) => (
        <div
          key={i}
          data-testid="selection-ring"
          className="pointer-events-none absolute"
          style={{
            top: rect.top - PADDING_Y,
            left: rect.left - PADDING_X,
            width: rect.width + PADDING_X * 2,
            height: rect.height + PADDING_Y * 2,
            borderRadius: 3,
            boxShadow: `0 0 0 1px ${ringColor}, 0 0 6px 1px ${glowColor}`,
          }}
        />
      ))}
    </>
  )
}
