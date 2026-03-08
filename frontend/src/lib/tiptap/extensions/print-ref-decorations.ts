import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const printRefPluginKey = new PluginKey("printRefDecorations");

export const PrintRefDecorationsExtension = Extension.create({
  name: "printRefDecorations",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: printRefPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, value) {
            const meta = tr.getMeta(printRefPluginKey);
            if (meta !== undefined) return meta;
            return value.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return printRefPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});

export function buildPrintRefDecorationSet(
  doc: import("@tiptap/pm/model").Node,
  refs: { pos: number; label: string }[],
): DecorationSet {
  const decorations: Decoration[] = [];
  for (const ref of refs) {
    if (ref.pos < 0 || ref.pos > doc.content.size) continue;
    const widget = Decoration.widget(
      ref.pos,
      () => {
        const sup = document.createElement("sup");
        sup.className = "print-ref-marker";
        sup.textContent = ref.label;
        return sup;
      },
      { side: 1 },
    );
    decorations.push(widget);
  }
  return DecorationSet.create(doc, decorations);
}
