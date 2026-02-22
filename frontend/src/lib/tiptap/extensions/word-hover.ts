// ProseMirror decoration plugin that applies a visual hover effect to the
// word under the mouse cursor in locked mode. Driven externally via
// transaction metadata from the useWordHover hook.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";

export const wordHoverPluginKey = new PluginKey("wordHover");

export const WordHoverExtension = Extension.create({
  name: "wordHover",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: wordHoverPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, value) {
            const meta = tr.getMeta(wordHoverPluginKey);
            if (meta !== undefined) return meta;
            return value.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return wordHoverPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
