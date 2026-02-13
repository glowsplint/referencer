import { useEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer } from "@/types/editor"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { arrowEndpointHighlightsPluginKey } from "@/lib/tiptap/extensions/arrow-endpoint-highlights"
import { blendWithBackground } from "@/lib/color"

const ARROW_OPACITY = 0.6

function tryPushDecoration(
  decorations: Decoration[],
  from: number,
  to: number,
  color: string
) {
  try {
    decorations.push(Decoration.inline(from, to, {
      class: "arrow-endpoint",
      style: `background-color: ${color}`,
    }))
  } catch {
    // Position may be invalid — skip
  }
}

export function useArrowEndpointDecorations(
  editor: Editor | null,
  layers: Layer[],
  editorIndex: number,
  isLocked: boolean,
  isDarkMode: boolean
) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    if (!isLocked) {
      const tr = editor.state.tr.setMeta(arrowEndpointHighlightsPluginKey, DecorationSet.empty)
      editor.view.dispatch(tr)
      return
    }

    const decorations: Decoration[] = []

    for (const layer of layers) {
      if (!layer.visible) continue
      const opaqueColor = blendWithBackground(layer.color, ARROW_OPACITY, isDarkMode)
      for (const arrow of layer.arrows) {
        if (arrow.from.editorIndex === editorIndex) {
          tryPushDecoration(decorations, arrow.from.from, arrow.from.to, opaqueColor)
        }
        if (arrow.to.editorIndex === editorIndex) {
          tryPushDecoration(decorations, arrow.to.from, arrow.to.to, opaqueColor)
        }
      }
    }

    const decorationSet = DecorationSet.create(editor.state.doc, decorations)
    const tr = editor.state.tr.setMeta(arrowEndpointHighlightsPluginKey, decorationSet)
    editor.view.dispatch(tr)
  }, [editor, layers, editorIndex, isLocked, isDarkMode])
}
