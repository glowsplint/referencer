import { useCallback, useRef } from "react"
import type { Editor } from "@tiptap/react"
import { getWordBoundaries } from "@/lib/tiptap/word-boundaries"

interface DragRange {
  editorIndex: number
  from: number
  to: number
  text: string
}

interface UseDragSelectionOptions {
  isLocked: boolean
  activeLayerId: string | null
  addHighlight: (
    layerId: string,
    highlight: { editorIndex: number; from: number; to: number; text: string; annotation: string }
  ) => string
  removeHighlight: (layerId: string, highlightId: string) => void
  layers: { id: string; highlights: { id: string; editorIndex: number; from: number; to: number }[] }[]
  selectWord: (editorIndex: number, from: number, to: number, text: string) => void
  clearSelection: () => void
}

export function useDragSelection({
  isLocked,
  activeLayerId,
  addHighlight,
  removeHighlight,
  layers,
  selectWord,
  clearSelection,
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

      dragRef.current = { anchor: word, current: word, dragging: false }
    },
    [isLocked, getWordAtEvent, clearSelection]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, editor: Editor, editorIndex: number) => {
      if (!isLocked || !editor || !dragRef.current) return

      const word = getWordAtEvent(e, editor, editorIndex)
      if (!word || word.editorIndex !== dragRef.current.anchor.editorIndex) return

      dragRef.current.current = word
      dragRef.current.dragging = true
    },
    [isLocked, getWordAtEvent]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent, editor: Editor, editorIndex: number) => {
      if (!isLocked || !editor || !dragRef.current) return
      // Don't interfere with annotation textareas
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return

      const { anchor, current } = dragRef.current
      dragRef.current = null

      // Compute the merged range
      const from = Math.min(anchor.from, current.from)
      const to = Math.max(anchor.to, current.to)
      const text = editor.state.doc.textBetween(from, to, " ")

      selectWord(editorIndex, from, to, text)

      if (activeLayerId) {
        const layer = layers.find((l) => l.id === activeLayerId)
        // Check for exact match to toggle off
        const existing = layer?.highlights.find(
          (h) => h.editorIndex === editorIndex && h.from === from && h.to === to
        )
        if (existing) {
          removeHighlight(activeLayerId, existing.id)
        } else {
          addHighlight(activeLayerId, {
            editorIndex,
            from,
            to,
            text,
            annotation: "",
          })
        }
      }
    },
    [isLocked, activeLayerId, layers, addHighlight, removeHighlight, selectWord]
  )

  return { handleMouseDown, handleMouseMove, handleMouseUp }
}
