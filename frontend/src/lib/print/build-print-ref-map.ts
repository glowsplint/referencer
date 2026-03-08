import type { Layer } from "@/types/editor";

export interface PrintRefMap {
  commentRefs: Map<string, number>;
  arrowRefs: Map<string, number>;
}

export function buildPrintRefMap(layers: Layer[], sectionVisibility: boolean[]): PrintRefMap {
  const commentRefs = new Map<string, number>();
  const arrowRefs = new Map<string, number>();

  let commentCounter = 0;
  let arrowCounter = 0;

  for (const layer of layers) {
    if (!layer.visible) continue;

    for (const h of layer.highlights) {
      if (sectionVisibility[h.editorIndex] === false) continue;
      if (h.type === "comment") {
        commentCounter++;
        commentRefs.set(h.id, commentCounter);
      }
    }

    for (const a of layer.arrows) {
      if (sectionVisibility[a.from.editorIndex] === false) continue;
      if (sectionVisibility[a.to.editorIndex] === false) continue;
      arrowCounter++;
      arrowRefs.set(a.id, arrowCounter);
    }
  }

  return { commentRefs, arrowRefs };
}
