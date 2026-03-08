import { useEffect, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import type { Layer } from "@/types/editor";
import {
  printRefPluginKey,
  buildPrintRefDecorationSet,
} from "@/lib/tiptap/extensions/print-ref-decorations";
import { buildPrintRefMap } from "@/lib/print/build-print-ref-map";

export function usePrintRefDecorations(
  editor: Editor | null,
  layers: Layer[],
  editorIndex: number,
  sectionVisibility: boolean[],
) {
  const refMap = useMemo(
    () => buildPrintRefMap(layers, sectionVisibility),
    [layers, sectionVisibility],
  );

  const refs = useMemo(() => {
    const result: { pos: number; label: string }[] = [];

    for (const layer of layers) {
      if (!layer.visible) continue;

      for (const h of layer.highlights) {
        if (h.editorIndex !== editorIndex) continue;
        if (h.type !== "comment") continue;
        const refNum = refMap.commentRefs.get(h.id);
        if (refNum !== undefined) {
          result.push({ pos: h.to, label: `[c${refNum}]` });
        }
      }

      for (const a of layer.arrows) {
        const refNum = refMap.arrowRefs.get(a.id);
        if (refNum === undefined) continue;
        if (a.from.editorIndex === editorIndex) {
          result.push({ pos: a.from.to, label: `[a${refNum}]` });
        }
        if (a.to.editorIndex === editorIndex) {
          result.push({ pos: a.to.to, label: `[a${refNum}]` });
        }
      }
    }

    result.sort((a, b) => a.pos - b.pos);
    return result;
  }, [layers, editorIndex, refMap]);

  useEffect(() => {
    if (!editor) return;
    const { state, view } = editor;
    if (!view || view.isDestroyed) return;

    const decorationSet = buildPrintRefDecorationSet(state.doc, refs);
    view.dispatch(state.tr.setMeta(printRefPluginKey, decorationSet));
  }, [editor, refs]);
}
