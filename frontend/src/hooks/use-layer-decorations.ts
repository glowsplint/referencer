import { useEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer } from "@/types/editor"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { layerHighlightsPluginKey } from "@/lib/tiptap/extensions/layer-highlights"
import { parseHexToRgba } from "@/lib/color"

export function useLayerDecorations(
  editor: Editor | null,
  layers: Layer[],
  editorIndex: number,
  isLocked: boolean,
  isLayersOn: boolean
) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    if (!isLocked || !isLayersOn) {
      const tr = editor.state.tr.setMeta(layerHighlightsPluginKey, DecorationSet.empty)
      editor.view.dispatch(tr)
      return
    }

    const decorations: Decoration[] = []

    for (const layer of layers) {
      if (!layer.visible) continue
      for (const highlight of layer.highlights) {
        if (highlight.editorIndex !== editorIndex) continue
        try {
          decorations.push(
            Decoration.inline(highlight.from, highlight.to, {
              style: `background-color: ${parseHexToRgba(layer.color, 0.3)}`,
            })
          )
        } catch {
          // Position may be invalid — skip
        }
      }
    }

    const decorationSet = DecorationSet.create(editor.state.doc, decorations)
    const tr = editor.state.tr.setMeta(layerHighlightsPluginKey, decorationSet)
    editor.view.dispatch(tr)
  }, [editor, layers, editorIndex, isLocked, isLayersOn])
}
