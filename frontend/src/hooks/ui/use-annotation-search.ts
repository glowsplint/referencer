import { useMemo } from "react";
import type { Layer, AnnotationSearchMatch } from "@/types/editor";

export function useAnnotationSearch(layers: Layer[], query: string): AnnotationSearchMatch[] {
  return useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const lowerQuery = trimmed.toLowerCase();
    const results: AnnotationSearchMatch[] = [];

    for (const layer of layers) {
      for (const h of layer.highlights) {
        const fields = [h.text, h.annotation];
        if (h.replies) {
          for (const r of h.replies) {
            fields.push(r.text);
          }
        }
        if (fields.some((f) => f && f.toLowerCase().includes(lowerQuery))) {
          results.push({
            layerId: layer.id,
            layerName: layer.name,
            layerColor: layer.color,
            annotationType: h.type,
            annotationId: h.id,
            displayText: h.annotation || h.text,
            editorIndex: h.editorIndex,
            from: h.from,
            to: h.to,
          });
        }
      }

      for (const a of layer.arrows) {
        const fields = [a.from.text, a.to.text];
        if (fields.some((f) => f && f.toLowerCase().includes(lowerQuery))) {
          results.push({
            layerId: layer.id,
            layerName: layer.name,
            layerColor: layer.color,
            annotationType: "arrow",
            annotationId: a.id,
            displayText: a.from.text + " -> " + a.to.text,
            editorIndex: a.from.editorIndex,
            from: a.from.from,
            to: a.from.to,
          });
        }
      }

      for (const u of layer.underlines) {
        if (u.text && u.text.toLowerCase().includes(lowerQuery)) {
          results.push({
            layerId: layer.id,
            layerName: layer.name,
            layerColor: layer.color,
            annotationType: "underline",
            annotationId: u.id,
            displayText: u.text,
            editorIndex: u.editorIndex,
            from: u.from,
            to: u.to,
          });
        }
      }
    }

    return results;
  }, [layers, query]);
}
