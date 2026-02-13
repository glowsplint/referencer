import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { DecorationSet } from "@tiptap/pm/view"

export const arrowEndpointHighlightsPluginKey = new PluginKey("arrowEndpointHighlights")

export const ArrowEndpointHighlightsExtension = Extension.create({
  name: "arrowEndpointHighlights",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: arrowEndpointHighlightsPluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, value) {
            const meta = tr.getMeta(arrowEndpointHighlightsPluginKey)
            if (meta !== undefined) return meta
            return value.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return arrowEndpointHighlightsPluginKey.getState(state)
          },
        },
      }),
    ]
  },
})
