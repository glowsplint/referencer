// ProseMirror decoration plugin that previews text segments matched by
// the "Remove Text by Filter" feature. Driven externally via transaction
// metadata from the useTextRemovalPreview hook.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";

export const textRemovalPreviewPluginKey = new PluginKey("textRemovalPreview");

export const TextRemovalPreviewExtension = Extension.create({
  name: "textRemovalPreview",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: textRemovalPreviewPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, value) {
            const meta = tr.getMeta(textRemovalPreviewPluginKey);
            if (meta !== undefined) return meta;
            return value.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return textRemovalPreviewPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
