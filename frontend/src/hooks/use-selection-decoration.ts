import { useLayoutEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"

export interface SelectionRect {
  top: number
  left: number
  width: number
  height: number
}

const SCROLL_PADDING = 40

/** Scroll the wrapper so the region at (top, left) with the given size is visible. */
export function scrollToKeepInView(
  wrapper: HTMLElement,
  top: number,
  left: number,
  height: number,
  width: number,
  padding: number = SCROLL_PADDING
): void {
  if (top < wrapper.scrollTop + padding) {
    wrapper.scrollTop = Math.max(0, top - padding)
  } else if (top + height > wrapper.scrollTop + wrapper.clientHeight - padding) {
    wrapper.scrollTop = top + height - wrapper.clientHeight + padding
  }

  if (left < wrapper.scrollLeft + padding) {
    wrapper.scrollLeft = Math.max(0, left - padding)
  } else if (left + width > wrapper.scrollLeft + wrapper.clientWidth - padding) {
    wrapper.scrollLeft = left + width - wrapper.clientWidth + padding
  }
}

/**
 * Merge DOMRects that share the same visual line into single per-line rects.
 * Adjacent inline elements (e.g. bold/italic mark boundaries) produce separate
 * rects on the same line — this combines them.
 */
function mergeLineRects(clientRects: DOMRectList): { top: number; left: number; width: number; height: number }[] {
  const rects: DOMRect[] = []
  for (let i = 0; i < clientRects.length; i++) {
    const r = clientRects[i]
    if (r.width > 0 && r.height > 0) rects.push(r)
  }
  if (rects.length === 0) return []

  rects.sort((a, b) => a.top - b.top || a.left - b.left)

  const merged: { top: number; left: number; right: number; bottom: number }[] = []

  for (const r of rects) {
    const last = merged[merged.length - 1]
    // Rects on the same visual line have similar top values
    if (last && Math.abs(r.top - last.top) < r.height * 0.5) {
      last.left = Math.min(last.left, r.left)
      last.right = Math.max(last.right, r.left + r.width)
      last.top = Math.min(last.top, r.top)
      last.bottom = Math.max(last.bottom, r.top + r.height)
    } else {
      merged.push({
        top: r.top,
        left: r.left,
        right: r.left + r.width,
        bottom: r.top + r.height,
      })
    }
  }

  return merged.map((m) => ({
    top: m.top,
    left: m.left,
    width: m.right - m.left,
    height: m.bottom - m.top,
  }))
}

export function useSelectionDecoration(
  editor: Editor | null,
  selection: WordSelection | null,
  editorIndex: number,
  wrapperRef: React.RefObject<HTMLDivElement | null>
): SelectionRect[] {
  const [rects, setRects] = useState<SelectionRect[]>([])

  useLayoutEffect(() => {
    if (
      !editor ||
      editor.isDestroyed ||
      !selection ||
      selection.editorIndex !== editorIndex
    ) {
      setRects([])
      return
    }

    const wrapper = wrapperRef.current
    if (!wrapper) {
      setRects([])
      return
    }

    try {
      const domStart = editor.view.domAtPos(selection.from)
      const domEnd = editor.view.domAtPos(selection.to)

      const range = document.createRange()
      range.setStart(domStart.node, domStart.offset)
      range.setEnd(domEnd.node, domEnd.offset)

      const wrapperRect = wrapper.getBoundingClientRect()
      const lineRects = mergeLineRects(range.getClientRects())

      const selectionRects: SelectionRect[] = lineRects.map((r) => ({
        top: r.top - wrapperRect.top + wrapper.scrollTop,
        left: r.left - wrapperRect.left + wrapper.scrollLeft,
        width: r.width,
        height: r.height,
      }))

      // Scroll to keep the last line rect in view
      if (selectionRects.length > 0) {
        const last = selectionRects[selectionRects.length - 1]
        scrollToKeepInView(
          wrapper,
          last.top,
          last.left,
          last.height,
          last.width
        )
      }

      setRects(selectionRects)
    } catch {
      setRects([])
    }
  }, [editor, selection, editorIndex, wrapperRef])

  return rects
}
