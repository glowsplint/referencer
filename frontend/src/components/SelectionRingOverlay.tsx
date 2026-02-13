import { useLayoutEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"

interface OverlayRect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING_X = 2
const PADDING_Y = 1

/** Merge b into a, expanding a to encompass both. */
function mergeInto(a: OverlayRect, b: OverlayRect): void {
  const newTop = Math.min(a.top, b.top)
  const newBottom = Math.max(a.top + a.height, b.top + b.height)
  const newLeft = Math.min(a.left, b.left)
  const newRight = Math.max(a.left + a.width, b.left + b.width)
  a.top = newTop
  a.left = newLeft
  a.width = newRight - newLeft
  a.height = newBottom - newTop
}

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

  // Merge all rects into a single bounding box (selection is always contiguous)
  const first = rects[0]
  const merged: OverlayRect = { ...first }
  for (let i = 1; i < rects.length; i++) {
    mergeInto(merged, rects[i])
  }

  return [merged]
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
