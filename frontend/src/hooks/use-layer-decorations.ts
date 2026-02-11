import { useEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer } from "@/types/editor"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { layerHighlightsPluginKey } from "@/lib/tiptap/extensions/layer-highlights"
import { blendWithBackground } from "@/lib/color"

const HIGHLIGHT_OPACITY = 0.3

function createHighlightDecoration(from: number, to: number, color: string): Decoration {
  return Decoration.inline(from, to, {
    style: `background-color: ${color}`,
  })
}

function tryPushDecoration(
  decorations: Decoration[],
  from: number,
  to: number,
  color: string
) {
  try {
    decorations.push(createHighlightDecoration(from, to, color))
  } catch {
    // Position may be invalid — skip
  }
}

export function useLayerDecorations(
  editor: Editor | null,
  layers: Layer[],
  editorIndex: number,
  isLocked: boolean,
  isDarkMode: boolean
) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    if (!isLocked) {
      const tr = editor.state.tr.setMeta(layerHighlightsPluginKey, DecorationSet.empty)
      editor.view.dispatch(tr)
      return
    }

    const decorations: Decoration[] = []

    for (const layer of layers) {
      if (!layer.visible) continue
      const opaqueColor = blendWithBackground(layer.color, HIGHLIGHT_OPACITY, isDarkMode)
      for (const highlight of layer.highlights) {
        if (highlight.editorIndex !== editorIndex) continue
        tryPushDecoration(decorations, highlight.from, highlight.to, opaqueColor)
      }
    }

    const decorationSet = DecorationSet.create(editor.state.doc, decorations)
    const tr = editor.state.tr.setMeta(layerHighlightsPluginKey, decorationSet)
    editor.view.dispatch(tr)
  }, [editor, layers, editorIndex, isLocked, isDarkMode])
}
