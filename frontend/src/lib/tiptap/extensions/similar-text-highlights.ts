import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { DecorationSet } from "@tiptap/pm/view"

export const similarTextPluginKey = new PluginKey("similarTextHighlights")

export const SimilarTextHighlightsExtension = Extension.create({
  name: "similarTextHighlights",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: similarTextPluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, value) {
            const meta = tr.getMeta(similarTextPluginKey)
            if (meta !== undefined) return meta
            return value.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return similarTextPluginKey.getState(state)
          },
        },
      }),
    ]
  },
})
