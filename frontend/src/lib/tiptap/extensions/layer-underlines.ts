import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { DecorationSet } from "@tiptap/pm/view"

export const layerUnderlinePluginKey = new PluginKey("layerUnderlines")

export const LayerUnderlineExtension = Extension.create({
  name: "layerUnderlines",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: layerUnderlinePluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, value) {
            const meta = tr.getMeta(layerUnderlinePluginKey)
            if (meta !== undefined) return meta
            return value.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return layerUnderlinePluginKey.getState(state)
          },
        },
      }),
    ]
  },
})
