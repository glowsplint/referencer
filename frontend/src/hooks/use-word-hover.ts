import { useEffect, useRef } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { wordHoverPluginKey } from "@/lib/tiptap/extensions/word-hover"
import { getWordBoundaries } from "@/lib/tiptap/word-boundaries"
import { blendWithBackground } from "@/lib/color"

export function useWordHover(
  editor: Editor | null,
  editorIndex: number,
  isLocked: boolean,
  isDarkMode: boolean,
  selection: WordSelection | null
) {
  const lastWordRef = useRef<{ from: number; to: number } | null>(null)

  useEffect(() => {
    if (!editor || editor.isDestroyed || !isLocked) {
      lastWordRef.current = null
      return
    }

    const dom = editor.view?.dom
    if (!dom) return

    const onMouseMove = (e: MouseEvent) => {
      const coords = { left: e.clientX, top: e.clientY }
      const posInfo = editor.view.posAtCoords(coords)
      if (!posInfo) {
        if (lastWordRef.current) {
          lastWordRef.current = null
          const tr = editor.state.tr.setMeta(wordHoverPluginKey, DecorationSet.empty)
          editor.view.dispatch(tr)
        }
        return
      }

      const word = getWordBoundaries(editor.state.doc, posInfo.pos)
      if (!word) {
        if (lastWordRef.current) {
          lastWordRef.current = null
          const tr = editor.state.tr.setMeta(wordHoverPluginKey, DecorationSet.empty)
          editor.view.dispatch(tr)
        }
        return
      }

      // Skip if same word as last hover
      if (lastWordRef.current && lastWordRef.current.from === word.from && lastWordRef.current.to === word.to) {
        return
      }

      // Skip if hovered word matches current selection
      if (selection && selection.editorIndex === editorIndex && selection.from === word.from && selection.to === word.to) {
        if (lastWordRef.current) {
          lastWordRef.current = null
          const tr = editor.state.tr.setMeta(wordHoverPluginKey, DecorationSet.empty)
          editor.view.dispatch(tr)
        }
        return
      }

      lastWordRef.current = { from: word.from, to: word.to }
      const bgColor = blendWithBackground("#94a3b8", 0.08, isDarkMode)
      try {
        const decoration = Decoration.inline(word.from, word.to, {
          style: `background-color: ${bgColor}; border-radius: 2px`,
          class: "word-hover",
        })
        const decorationSet = DecorationSet.create(editor.state.doc, [decoration])
        const tr = editor.state.tr.setMeta(wordHoverPluginKey, decorationSet)
        editor.view.dispatch(tr)
      } catch {
        lastWordRef.current = null
      }
    }

    const onMouseLeave = () => {
      if (lastWordRef.current) {
        lastWordRef.current = null
        const tr = editor.state.tr.setMeta(wordHoverPluginKey, DecorationSet.empty)
        editor.view.dispatch(tr)
      }
    }

    dom.addEventListener("mousemove", onMouseMove)
    dom.addEventListener("mouseleave", onMouseLeave)
    return () => {
      dom.removeEventListener("mousemove", onMouseMove)
      dom.removeEventListener("mouseleave", onMouseLeave)
      // Clear decoration on cleanup
      if (!editor.isDestroyed) {
        const tr = editor.state.tr.setMeta(wordHoverPluginKey, DecorationSet.empty)
        editor.view.dispatch(tr)
      }
      lastWordRef.current = null
    }
  }, [editor, editorIndex, isLocked, isDarkMode, selection])
}
