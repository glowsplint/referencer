// Implements word-level mouse drag selection in locked/annotation mode.
// On mousedown, selects the word under the cursor; on mousemove, extends
// the selection to cover the range from the anchor word to the current word;
// on mouseup, finalizes the range selection for use by annotation tools.
import { useCallback, useRef } from "react"
import type { Editor } from "@tiptap/react"
import { getWordBoundaries } from "@/lib/tiptap/word-boundaries"
import type { ActiveTool, WordSelection } from "@/types/editor"

interface DragRange {
  editorIndex: number
  from: number
  to: number
  text: string
}

interface UseDragSelectionOptions {
  isLocked: boolean
  activeTool: ActiveTool
  selectWord: (editorIndex: number, from: number, to: number, text: string) => void
  selectRange: (anchor: WordSelection, head: WordSelection, merged: WordSelection) => void
  clearSelection: () => void
  eraseAtPosition?: (editorIndex: number, from: number, to: number) => void
}

export function useDragSelection({
  isLocked,
  activeTool,
  selectWord,
  selectRange,
  clearSelection,
  eraseAtPosition,
}: UseDragSelectionOptions) {
  const dragRef = useRef<{
    anchor: DragRange
    current: DragRange
    dragging: boolean
  } | null>(null)

  const getWordAtEvent = useCallback(
    (e: React.MouseEvent, editor: Editor, editorIndex: number): DragRange | null => {
      const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY })
      if (!pos) return null
      const result = getWordBoundaries(editor.state.doc, pos.pos)
      if (!result) return null
      return { editorIndex, from: result.from, to: result.to, text: result.text }
    },
    []
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, editor: Editor, editorIndex: number) => {
      if (!isLocked || !editor) return
      // Don't interfere with annotation textareas
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return

      const word = getWordAtEvent(e, editor, editorIndex)
      if (!word) {
        clearSelection()
        return
      }

      if (activeTool === "eraser" && eraseAtPosition) {
        dragRef.current = { anchor: word, current: word, dragging: false }
        eraseAtPosition(editorIndex, word.from, word.to)
        return
      }

      dragRef.current = { anchor: word, current: word, dragging: false }
      selectWord(editorIndex, word.from, word.to, word.text)
    },
    [isLocked, activeTool, getWordAtEvent, clearSelection, selectWord, eraseAtPosition]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, editor: Editor, editorIndex: number) => {
      if (!isLocked || !editor || !dragRef.current) return

      const word = getWordAtEvent(e, editor, editorIndex)
      if (!word || word.editorIndex !== dragRef.current.anchor.editorIndex) return

      dragRef.current.current = word
      dragRef.current.dragging = true

      if (activeTool === "eraser" && eraseAtPosition) {
        eraseAtPosition(editorIndex, word.from, word.to)
        return
      }

      // Live preview of the selection range during drag
      const from = Math.min(dragRef.current.anchor.from, word.from)
      const to = Math.max(dragRef.current.anchor.to, word.to)
      const text = editor.state.doc.textBetween(from, to, " ")
      selectWord(editorIndex, from, to, text)
    },
    [isLocked, activeTool, getWordAtEvent, selectWord, eraseAtPosition]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent, editor: Editor, editorIndex: number) => {
      if (!isLocked || !editor || !dragRef.current) return
      // Don't interfere with annotation textareas
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return

      if (activeTool === "eraser") {
        dragRef.current = null
        return
      }

      const { anchor, current, dragging } = dragRef.current
      dragRef.current = null

      // Compute the merged range
      const from = Math.min(anchor.from, current.from)
      const to = Math.max(anchor.to, current.to)
      const text = editor.state.doc.textBetween(from, to, " ")

      if (dragging && anchor.from !== current.from) {
        // Drag produced a range — set anchor/head so Shift+Arrow can extend
        selectRange(
          { editorIndex, from: anchor.from, to: anchor.to, text: anchor.text },
          { editorIndex, from: current.from, to: current.to, text: current.text },
          { editorIndex, from, to, text }
        )
      } else {
        selectWord(editorIndex, from, to, text)
      }
    },
    [isLocked, activeTool, selectWord, selectRange]
  )

  return { handleMouseDown, handleMouseMove, handleMouseUp }
}
