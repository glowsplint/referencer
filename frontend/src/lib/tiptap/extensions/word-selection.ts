// ProseMirror decoration plugin that renders the active word selection
// highlight in locked mode. Driven externally via transaction metadata
// from the useSelectionHighlight hook.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";

export const wordSelectionPluginKey = new PluginKey("wordSelection");

export const WordSelectionExtension = Extension.create({
  name: "wordSelection",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: wordSelectionPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, value) {
            const meta = tr.getMeta(wordSelectionPluginKey);
            if (meta !== undefined) return meta;
            return value.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return wordSelectionPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
