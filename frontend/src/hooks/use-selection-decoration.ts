import { useLayoutEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"

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

/** Scroll the wrapper to keep the current word selection in view. */
export function useSelectionScroll(
  editor: Editor | null,
  selection: WordSelection | null,
  editorIndex: number,
  wrapperRef: React.RefObject<HTMLDivElement | null>
): void {
  useLayoutEffect(() => {
    if (
      !editor ||
      editor.isDestroyed ||
      !selection ||
      selection.editorIndex !== editorIndex
    ) {
      return
    }

    const wrapper = wrapperRef.current
    if (!wrapper) return

    try {
      const domStart = editor.view.domAtPos(selection.from)
      const domEnd = editor.view.domAtPos(selection.to)

      const range = document.createRange()
      range.setStart(domStart.node, domStart.offset)
      range.setEnd(domEnd.node, domEnd.offset)

      const wordRect = range.getBoundingClientRect()
      const wrapperRect = wrapper.getBoundingClientRect()

      const topInContent = wordRect.top - wrapperRect.top + wrapper.scrollTop
      const leftInContent = wordRect.left - wrapperRect.left + wrapper.scrollLeft

      scrollToKeepInView(
        wrapper,
        topInContent,
        leftInContent,
        wordRect.height,
        wordRect.width
      )
    } catch {
      // Position may be invalid — skip
    }
  }, [editor, selection, editorIndex, wrapperRef])
}
