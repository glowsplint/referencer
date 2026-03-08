import * as Y from "yjs";

export interface AnnotationIndexRow {
  id: string;
  layer_id: string;
  layer_name: string;
  annotation_type: "highlight" | "comment" | "arrow" | "underline";
  selected_text: string;
  annotation_text: string;
  reply_texts: string;
  user_name: string;
}

const HTML_TAG_RE = /<[^>]*>/g;

function stripHtml(s: string): string {
  return s.replace(HTML_TAG_RE, "");
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

function getString(map: Y.Map<unknown>, key: string): string {
  const val = map.get(key);
  return typeof val === "string" ? val : "";
}

export function extractAnnotations(doc: Y.Doc): AnnotationIndexRow[] {
  const layers = doc.getArray("layers");
  const rows: AnnotationIndexRow[] = [];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers.get(i) as Y.Map<unknown>;
    if (!(layer instanceof Y.Map)) continue;

    const layerId = getString(layer, "id");
    const layerName = getString(layer, "name");

    // Process highlights
    const highlights = layer.get("highlights");
    if (highlights instanceof Y.Array) {
      for (let j = 0; j < highlights.length; j++) {
        const h = highlights.get(j) as Y.Map<unknown>;
        if (!(h instanceof Y.Map)) continue;

        const hType = getString(h, "type");
        const annotationType: "highlight" | "comment" =
          hType === "comment" ? "comment" : "highlight";

        const selectedText = truncate(stripHtml(getString(h, "text")), 1000);
        const annotationText = truncate(stripHtml(getString(h, "annotation")), 2000);

        // Process replies
        let replyTexts = "";
        const replies = h.get("replies");
        if (replies instanceof Y.Array) {
          const parts: string[] = [];
          for (let k = 0; k < replies.length; k++) {
            const reply = replies.get(k) as Y.Map<unknown>;
            if (reply instanceof Y.Map) {
              const text = stripHtml(getString(reply, "text"));
              if (text) parts.push(text);
            }
          }
          replyTexts = truncate(parts.join("\n"), 2000);
        }

        if (!selectedText && !annotationText && !replyTexts) continue;

        rows.push({
          id: getString(h, "id"),
          layer_id: layerId,
          layer_name: layerName,
          annotation_type: annotationType,
          selected_text: selectedText,
          annotation_text: annotationText,
          reply_texts: replyTexts,
          user_name: getString(h, "userName"),
        });
      }
    }

    // Process arrows
    const arrows = layer.get("arrows");
    if (arrows instanceof Y.Array) {
      for (let j = 0; j < arrows.length; j++) {
        const a = arrows.get(j) as Y.Map<unknown>;
        if (!(a instanceof Y.Map)) continue;

        const fromText = stripHtml(getString(a, "fromText"));
        const toText = stripHtml(getString(a, "toText"));
        const selectedText = truncate(fromText || toText ? `${fromText} -> ${toText}` : "", 1000);

        if (!selectedText) continue;

        rows.push({
          id: getString(a, "id"),
          layer_id: layerId,
          layer_name: layerName,
          annotation_type: "arrow",
          selected_text: selectedText,
          annotation_text: "",
          reply_texts: "",
          user_name: "",
        });
      }
    }

    // Process underlines
    const underlines = layer.get("underlines");
    if (underlines instanceof Y.Array) {
      for (let j = 0; j < underlines.length; j++) {
        const u = underlines.get(j) as Y.Map<unknown>;
        if (!(u instanceof Y.Map)) continue;

        const selectedText = truncate(stripHtml(getString(u, "text")), 1000);

        if (!selectedText) continue;

        rows.push({
          id: getString(u, "id"),
          layer_id: layerId,
          layer_name: layerName,
          annotation_type: "underline",
          selected_text: selectedText,
          annotation_text: "",
          reply_texts: "",
          user_name: "",
        });
      }
    }
  }

  return rows;
}
