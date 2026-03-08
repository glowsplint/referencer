import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { cleanPastedHtml } from "../paste-html-cleaner";

export const pasteCleanerPluginKey = new PluginKey("pasteCleaner");

export const PasteCleanerExtension = Extension.create({
  name: "pasteCleaner",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pasteCleanerPluginKey,
        props: {
          transformPastedHTML(html) {
            return cleanPastedHtml(html);
          },
        },
      }),
    ];
  },
});
