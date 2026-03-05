import { useTranslation } from "react-i18next";
import type { Layer } from "@/types/editor";
import { migrateAnnotation } from "@/lib/annotation/migrate-annotation";
import { sanitizeColor } from "@/lib/sanitize-color";

interface PrintAnnotationsProps {
  layers: Layer[];
  sectionNames: string[];
  sectionVisibility: boolean[];
}

interface CollectedComment {
  layerColor: string;
  layerName: string;
  text: string;
  annotation: string;
  editorIndex: number;
  replies: {
    id: string;
    text: string;
    userName: string;
    timestamp: number;
  }[];
}

interface CollectedHighlight {
  layerColor: string;
  layerName: string;
  text: string;
  editorIndex: number;
}

interface CollectedUnderline {
  layerColor: string;
  layerName: string;
  text: string;
  editorIndex: number;
}

interface CollectedArrow {
  layerColor: string;
  layerName: string;
  fromText: string;
  toText: string;
  fromSection: string;
  toSection: string;
  arrowStyle: string;
}

export function PrintAnnotations({
  layers,
  sectionNames,
  sectionVisibility,
}: PrintAnnotationsProps) {
  const { t } = useTranslation();

  const comments: CollectedComment[] = [];
  const highlights: CollectedHighlight[] = [];
  const underlines: CollectedUnderline[] = [];
  const arrows: CollectedArrow[] = [];

  for (const layer of layers) {
    if (!layer.visible) continue;

    for (const h of layer.highlights) {
      if (sectionVisibility[h.editorIndex] === false) continue;
      if (h.type === "comment") {
        comments.push({
          layerColor: layer.color,
          layerName: layer.name,
          text: h.text,
          annotation: h.annotation,
          editorIndex: h.editorIndex,
          replies: (h.replies ?? []).map((r) => ({
            id: r.id,
            text: r.text,
            userName: r.userName,
            timestamp: r.timestamp,
          })),
        });
      } else if (h.type === "highlight") {
        highlights.push({
          layerColor: layer.color,
          layerName: layer.name,
          text: h.text,
          editorIndex: h.editorIndex,
        });
      }
    }

    for (const u of layer.underlines) {
      if (sectionVisibility[u.editorIndex] === false) continue;
      underlines.push({
        layerColor: layer.color,
        layerName: layer.name,
        text: u.text,
        editorIndex: u.editorIndex,
      });
    }

    for (const a of layer.arrows) {
      if (sectionVisibility[a.from.editorIndex] === false) continue;
      if (sectionVisibility[a.to.editorIndex] === false) continue;
      arrows.push({
        layerColor: layer.color,
        layerName: layer.name,
        fromText: a.from.text,
        toText: a.to.text,
        fromSection:
          sectionNames[a.from.editorIndex] ?? `Text ${a.from.editorIndex + 1}`,
        toSection:
          sectionNames[a.to.editorIndex] ?? `Text ${a.to.editorIndex + 1}`,
        arrowStyle: a.arrowStyle ?? "solid",
      });
    }
  }

  const hasAny =
    comments.length > 0 ||
    highlights.length > 0 ||
    underlines.length > 0 ||
    arrows.length > 0;
  if (!hasAny) return null;

  // Group by passage
  function groupByPassage<T extends { editorIndex: number }>(items: T[]) {
    const sorted = [...items].sort((a, b) => a.editorIndex - b.editorIndex);
    const grouped = new Map<number, T[]>();
    for (const item of sorted) {
      const group = grouped.get(item.editorIndex) ?? [];
      group.push(item);
      grouped.set(item.editorIndex, group);
    }
    return grouped;
  }

  const groupedComments = groupByPassage(comments);
  const groupedHighlights = groupByPassage(highlights);
  const groupedUnderlines = groupByPassage(underlines);

  return (
    <div className="print-annotations">
      {/* Comments */}
      {comments.length > 0 && (
        <div className="print-annotation-group">
          <h3 className="text-sm font-semibold mb-2 border-b border-zinc-300 pb-1">
            {t("print.comments")}
          </h3>
          {[...groupedComments.entries()].map(([editorIndex, items]) => (
            <div key={editorIndex} className="mb-3">
              <div className="text-[10px] font-medium text-zinc-500 mb-1">
                {sectionNames[editorIndex] ??
                  t("text", { number: editorIndex + 1 })}
              </div>
              {items.map((item, i) => (
                <div
                  key={`comment-${item.layerName}-${item.text}-${i}`}
                  className="mb-2 border-l-2 pl-2"
                  style={{ borderColor: sanitizeColor(item.layerColor) }}
                >
                  <div className="text-[10px] font-bold italic text-zinc-600 mb-0.5">
                    &ldquo;{item.text}&rdquo;
                  </div>
                  {item.annotation && (
                    <div
                      className="text-xs text-zinc-800 prose-xs"
                      dangerouslySetInnerHTML={{
                        __html: migrateAnnotation(item.annotation),
                      }}
                    />
                  )}
                  {item.replies.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="text-[10px] text-zinc-600"
                        >
                          <span className="font-medium">
                            {t("print.replyBy", {
                              userName: reply.userName,
                              date: new Date(reply.timestamp).toLocaleDateString(),
                            })}
                          </span>
                          <span className="block text-xs text-zinc-800">
                            {reply.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="print-annotation-group">
          <h3 className="text-sm font-semibold mb-2 border-b border-zinc-300 pb-1">
            {t("print.highlights")}
          </h3>
          {[...groupedHighlights.entries()].map(([editorIndex, items]) => (
            <div key={editorIndex} className="mb-3">
              <div className="text-[10px] font-medium text-zinc-500 mb-1">
                {sectionNames[editorIndex] ??
                  t("text", { number: editorIndex + 1 })}
              </div>
              {items.map((item, i) => (
                <div
                  key={`highlight-${item.layerName}-${item.text}-${i}`}
                  className="mb-1 border-l-2 pl-2"
                  style={{ borderColor: sanitizeColor(item.layerColor) }}
                >
                  <div className="text-[10px] italic text-zinc-600">
                    &ldquo;{item.text}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Underlines */}
      {underlines.length > 0 && (
        <div className="print-annotation-group">
          <h3 className="text-sm font-semibold mb-2 border-b border-zinc-300 pb-1">
            {t("print.underlines")}
          </h3>
          {[...groupedUnderlines.entries()].map(([editorIndex, items]) => (
            <div key={editorIndex} className="mb-3">
              <div className="text-[10px] font-medium text-zinc-500 mb-1">
                {sectionNames[editorIndex] ??
                  t("text", { number: editorIndex + 1 })}
              </div>
              {items.map((item, i) => (
                <div
                  key={`underline-${item.layerName}-${item.text}-${i}`}
                  className="mb-1 border-l-2 pl-2"
                  style={{ borderColor: sanitizeColor(item.layerColor) }}
                >
                  <div className="text-[10px] italic text-zinc-600">
                    &ldquo;{item.text}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Arrows / Connections */}
      {arrows.length > 0 && (
        <div className="print-annotation-group">
          <h3 className="text-sm font-semibold mb-2 border-b border-zinc-300 pb-1">
            {t("print.connections")}
          </h3>
          {arrows.map((arrow, i) => (
            <div
              key={`arrow-${i}`}
              className="mb-1 border-l-2 pl-2 text-[10px] text-zinc-600"
              style={{ borderColor: sanitizeColor(arrow.layerColor) }}
            >
              <span>
                &ldquo;{arrow.fromText}&rdquo; ({arrow.fromSection}){" "}
                &rarr;{" "}
                &ldquo;{arrow.toText}&rdquo; ({arrow.toSection})
                {arrow.arrowStyle !== "solid" && (
                  <span className="text-zinc-400"> [{arrow.arrowStyle}]</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
