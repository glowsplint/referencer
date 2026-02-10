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

export function useSelectionDecoration(
  editor: Editor | null,
  selection: WordSelection | null,
  editorIndex: number,
  wrapperRef: React.RefObject<HTMLDivElement | null>
): SelectionRect | null {
  const [rect, setRect] = useState<SelectionRect | null>(null)

  useLayoutEffect(() => {
    if (
      !editor ||
      editor.isDestroyed ||
      !selection ||
      selection.editorIndex !== editorIndex
    ) {
      setRect(null)
      return
    }

    const wrapper = wrapperRef.current
    if (!wrapper) {
      setRect(null)
      return
    }

    try {
      // Use a DOM Range to get a single bounding rect that spans across
      // mark boundaries (e.g. subscript/superscript), producing one unified
      // box instead of the multiple spans ProseMirror's Decoration.inline
      // would create at each mark boundary.
      const domStart = editor.view.domAtPos(selection.from)
      const domEnd = editor.view.domAtPos(selection.to)

      const range = document.createRange()
      range.setStart(domStart.node, domStart.offset)
      range.setEnd(domEnd.node, domEnd.offset)

      const wordRect = range.getBoundingClientRect()
      const wrapperRect = wrapper.getBoundingClientRect()

      // Convert viewport coords to scroll-content coords (stable regardless
      // of scroll position changes below).
      const topInContent = wordRect.top - wrapperRect.top + wrapper.scrollTop
      const leftInContent = wordRect.left - wrapperRect.left + wrapper.scrollLeft

      // Scroll the wrapper so the selected word stays in view during
      // keyboard navigation.
      scrollToKeepInView(
        wrapper,
        topInContent,
        leftInContent,
        wordRect.height,
        wordRect.width
      )

      setRect({
        top: topInContent,
        left: leftInContent,
        width: wordRect.width,
        height: wordRect.height,
      })
    } catch {
      setRect(null)
    }
  }, [editor, selection, editorIndex, wrapperRef])

  return rect
}
