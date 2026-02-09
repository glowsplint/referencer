import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { DecorationSet } from "@tiptap/pm/view"

export const layerHighlightsPluginKey = new PluginKey("layerHighlights")

export const LayerHighlightsExtension = Extension.create({
  name: "layerHighlights",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: layerHighlightsPluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, value) {
            const meta = tr.getMeta(layerHighlightsPluginKey)
            if (meta !== undefined) return meta
            return value.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return layerHighlightsPluginKey.getState(state)
          },
        },
      }),
    ]
  },
})
