import { useEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { wordSelectionPluginKey } from "@/lib/tiptap/extensions/word-selection"
import { blendWithBackground } from "@/lib/color"

/**
 * Renders the current word selection as an inline highlight decoration
 * using the active layer's color (or a fallback blue).
 * Uses a separate ProseMirror plugin so it doesn't merge with layer highlights.
 */
export function useSelectionHighlight(
  editor: Editor | null,
  selection: WordSelection | null,
  editorIndex: number,
  isLocked: boolean,
  activeLayerColor: string | null,
  isDarkMode: boolean
) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    if (
      !isLocked ||
      !selection ||
      selection.editorIndex !== editorIndex
    ) {
      const tr = editor.state.tr.setMeta(wordSelectionPluginKey, DecorationSet.empty)
      editor.view.dispatch(tr)
      return
    }

    const bgColor = activeLayerColor
      ? blendWithBackground(activeLayerColor, 0.3, isDarkMode)
      : blendWithBackground("#3b82f6", 0.25, isDarkMode)

    try {
      const decoration = Decoration.inline(selection.from, selection.to, {
        style: `background-color: ${bgColor}; border-radius: 2px`,
        class: "word-selection",
      })
      const decorationSet = DecorationSet.create(editor.state.doc, [decoration])
      const tr = editor.state.tr.setMeta(wordSelectionPluginKey, decorationSet)
      editor.view.dispatch(tr)
    } catch {
      const tr = editor.state.tr.setMeta(wordSelectionPluginKey, DecorationSet.empty)
      editor.view.dispatch(tr)
    }
  }, [editor, selection, editorIndex, isLocked, activeLayerColor, isDarkMode])
}
