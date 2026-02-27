import type { Layer } from "@/types/editor";
import { migrateAnnotation } from "@/lib/annotation/migrate-annotation";
import { sanitizeColor } from "@/lib/sanitize-color";

interface PrintAnnotationsProps {
  layers: Layer[];
  sectionNames: string[];
  sectionVisibility: boolean[];
}

export function PrintAnnotations({
  layers,
  sectionNames,
  sectionVisibility,
}: PrintAnnotationsProps) {
  // Collect all visible comments in document order
  const comments: {
    layerColor: string;
    layerName: string;
    text: string;
    annotation: string;
    editorIndex: number;
  }[] = [];

  for (const layer of layers) {
    if (!layer.visible) continue;
    for (const h of layer.highlights) {
      if (h.type !== "comment") continue;
      if (sectionVisibility[h.editorIndex] === false) continue;
      comments.push({
        layerColor: layer.color,
        layerName: layer.name,
        text: h.text,
        annotation: h.annotation,
        editorIndex: h.editorIndex,
      });
    }
  }

  // Sort by editorIndex then by appearance
  comments.sort((a, b) => a.editorIndex - b.editorIndex);

  // Group by passage
  const grouped = new Map<number, typeof comments>();
  for (const c of comments) {
    const group = grouped.get(c.editorIndex) ?? [];
    group.push(c);
    grouped.set(c.editorIndex, group);
  }

  if (comments.length === 0) return null;

  return (
    <div className="print-annotations">
      <h3 className="text-sm font-semibold mb-2 border-b border-zinc-300 pb-1">Comments</h3>
      {[...grouped.entries()].map(([editorIndex, items]) => (
        <div key={editorIndex} className="mb-3">
          <div className="text-[10px] font-medium text-zinc-500 mb-1">
            {sectionNames[editorIndex] ?? `Passage ${editorIndex + 1}`}
          </div>
          {items.map((item, i) => (
            <div
              key={i}
              className="mb-2 border-l-2 pl-2"
              style={{ borderColor: sanitizeColor(item.layerColor) }}
            >
              <div className="text-[10px] font-bold italic text-zinc-600 mb-0.5">
                &ldquo;{item.text}&rdquo;
              </div>
              {item.annotation && (
                <div
                  className="text-xs text-zinc-800 prose-xs"
                  dangerouslySetInnerHTML={{ __html: migrateAnnotation(item.annotation) }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
