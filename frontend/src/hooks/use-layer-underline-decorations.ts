// Syncs underline decorations from layer data into the ProseMirror
// layer-underlines plugin. Rebuilds the decoration set whenever layers
// change and clears decorations when the editor is unlocked.
import { useEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer } from "@/types/editor"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { layerUnderlinePluginKey } from "@/lib/tiptap/extensions/layer-underlines"

function createUnderlineDecoration(from: number, to: number, color: string): Decoration {
  return Decoration.inline(from, to, {
    style: `text-decoration: underline; text-decoration-color: ${color}; text-decoration-thickness: 2px; text-underline-offset: 2px`,
  })
}

function tryPushDecoration(
  decorations: Decoration[],
  from: number,
  to: number,
  color: string
) {
  try {
    decorations.push(createUnderlineDecoration(from, to, color))
  } catch {
    // Position may be invalid — skip
  }
}

export function useLayerUnderlineDecorations(
  editor: Editor | null,
  layers: Layer[],
  editorIndex: number,
  isLocked: boolean,
  _isDarkMode: boolean
) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    if (!isLocked) {
      const tr = editor.state.tr.setMeta(layerUnderlinePluginKey, DecorationSet.empty)
      editor.view.dispatch(tr)
      return
    }

    const decorations: Decoration[] = []

    for (const layer of layers) {
      if (!layer.visible) continue
      for (const underline of layer.underlines) {
        if (underline.editorIndex !== editorIndex) continue
        tryPushDecoration(decorations, underline.from, underline.to, layer.color)
      }
    }

    const decorationSet = DecorationSet.create(editor.state.doc, decorations)
    const tr = editor.state.tr.setMeta(layerUnderlinePluginKey, decorationSet)
    editor.view.dispatch(tr)
  }, [editor, layers, editorIndex, isLocked, _isDarkMode])
}
