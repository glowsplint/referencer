import { useLayoutEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"

export interface SelectionRect {
  top: number
  left: number
  width: number
  height: number
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

      // Convert viewport coords to scroll-content coords so the overlay
      // scrolls correctly with the content inside the wrapper.
      setRect({
        top: wordRect.top - wrapperRect.top + wrapper.scrollTop,
        left: wordRect.left - wrapperRect.left + wrapper.scrollLeft,
        width: wordRect.width,
        height: wordRect.height,
      })
    } catch {
      setRect(null)
    }
  }, [editor, selection, editorIndex, wrapperRef])

  return rect
}
