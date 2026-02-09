import { useEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { wordSelectionPluginKey } from "@/lib/tiptap/extensions/word-selection"

export function useSelectionDecoration(
  editor: Editor | null,
  selection: WordSelection | null,
  editorIndex: number
) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    let decorationSet: DecorationSet

    if (selection && selection.editorIndex === editorIndex) {
      try {
        const decoration = Decoration.inline(selection.from, selection.to, {
          class: "word-selection",
        })
        decorationSet = DecorationSet.create(editor.state.doc, [decoration])
      } catch {
        decorationSet = DecorationSet.empty
      }
    } else {
      decorationSet = DecorationSet.empty
    }

    const tr = editor.state.tr.setMeta(wordSelectionPluginKey, decorationSet)
    editor.view.dispatch(tr)
  }, [editor, selection, editorIndex])
}
