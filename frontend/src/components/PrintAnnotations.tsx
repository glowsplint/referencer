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
  fromEditorIndex: number;
  toEditorIndex: number;
  arrowStyle: string;
  arrowNumber: number;
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

  let arrowCounter = 0;

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
      arrowCounter++;
      arrows.push({
        layerColor: layer.color,
        layerName: layer.name,
        fromText: a.from.text,
        toText: a.to.text,
        fromSection: sectionNames[a.from.editorIndex] ?? `Text ${a.from.editorIndex + 1}`,
        toSection: sectionNames[a.to.editorIndex] ?? `Text ${a.to.editorIndex + 1}`,
        fromEditorIndex: a.from.editorIndex,
        toEditorIndex: a.to.editorIndex,
        arrowStyle: a.arrowStyle ?? "solid",
        arrowNumber: arrowCounter,
      });
    }
  }

  const hasAny =
    comments.length > 0 || highlights.length > 0 || underlines.length > 0 || arrows.length > 0;
  if (!hasAny) return null;

  // Collect all section indices that have at least one annotation
  const sectionIndices = new Set<number>();
  for (const c of comments) sectionIndices.add(c.editorIndex);
  for (const h of highlights) sectionIndices.add(h.editorIndex);
  for (const u of underlines) sectionIndices.add(u.editorIndex);
  for (const a of arrows) {
    sectionIndices.add(a.fromEditorIndex);
    sectionIndices.add(a.toEditorIndex);
  }

  const sortedSections = [...sectionIndices].sort((a, b) => a - b);

  // Group items by section
  function groupBySection<T extends { editorIndex: number }>(items: T[]) {
    const grouped = new Map<number, T[]>();
    for (const item of items) {
      const group = grouped.get(item.editorIndex) ?? [];
      group.push(item);
      grouped.set(item.editorIndex, group);
    }
    return grouped;
  }

  const commentsBySection = groupBySection(comments);
  const highlightsBySection = groupBySection(highlights);
  const underlinesBySection = groupBySection(underlines);

  // Group arrows by their "from" section for display within sections
  const arrowsByFromSection = new Map<number, CollectedArrow[]>();
  for (const arrow of arrows) {
    const group = arrowsByFromSection.get(arrow.fromEditorIndex) ?? [];
    group.push(arrow);
    arrowsByFromSection.set(arrow.fromEditorIndex, group);
  }

  return (
    <div className="print-annotations">
      {sortedSections.map((sectionIndex) => {
        const sectionComments = commentsBySection.get(sectionIndex) ?? [];
        const sectionHighlights = highlightsBySection.get(sectionIndex) ?? [];
        const sectionUnderlines = underlinesBySection.get(sectionIndex) ?? [];
        const sectionArrows = arrowsByFromSection.get(sectionIndex) ?? [];
        const hasSectionContent =
          sectionComments.length > 0 ||
          sectionHighlights.length > 0 ||
          sectionUnderlines.length > 0 ||
          sectionArrows.length > 0;

        if (!hasSectionContent) return null;

        return (
          <div key={sectionIndex} className="print-annotation-group mb-4">
            <h3 className="print-section-heading text-xs font-semibold mb-2 border-b border-zinc-300 pb-1">
              {sectionNames[sectionIndex] ?? t("text", { number: sectionIndex + 1 })}
            </h3>

            {/* Comments for this section */}
            {sectionComments.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-medium text-zinc-500 mb-1">
                  {t("print.comments")}
                </div>
                {sectionComments.map((item, i) => (
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
                          <div key={reply.id} className="text-[10px] text-zinc-600">
                            <span className="font-medium">
                              {t("print.replyBy", {
                                userName: reply.userName,
                                date: new Date(reply.timestamp).toLocaleDateString(),
                              })}
                            </span>
                            <span className="block text-xs text-zinc-800">{reply.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Highlights for this section */}
            {sectionHighlights.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-medium text-zinc-500 mb-1">
                  {t("print.highlights")}
                </div>
                {sectionHighlights.map((item, i) => (
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
            )}

            {/* Underlines for this section */}
            {sectionUnderlines.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-medium text-zinc-500 mb-1">
                  {t("print.underlines")}
                </div>
                {sectionUnderlines.map((item, i) => (
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
            )}

            {/* Arrows originating from this section */}
            {sectionArrows.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-medium text-zinc-500 mb-1">
                  {t("print.connections")}
                </div>
                {sectionArrows.map((arrow) => (
                  <div
                    key={`arrow-${arrow.arrowNumber}`}
                    className="mb-1 border-l-2 pl-2 text-[10px] text-zinc-600"
                    style={{ borderColor: sanitizeColor(arrow.layerColor) }}
                  >
                    <span className="print-cross-ref-number font-bold text-blue-500 text-[0.625rem]">
                      [{arrow.arrowNumber}]
                    </span>{" "}
                    <span>
                      &ldquo;{arrow.fromText}&rdquo; &rarr; &ldquo;{arrow.toText}&rdquo; (
                      {arrow.toSection})
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
      })}

      {/* Cross-References summary */}
      {arrows.length > 0 && (
        <div className="print-annotation-group mt-4">
          <h3 className="text-sm font-semibold mb-2 border-b border-zinc-300 pb-1">
            {t("print.crossReferences")}
          </h3>
          {arrows.map((arrow) => (
            <div key={`xref-${arrow.arrowNumber}`} className="mb-1 text-[10px] text-zinc-600 pl-2">
              <span className="print-cross-ref-number font-bold text-blue-500 text-[0.625rem]">
                [{arrow.arrowNumber}]
              </span>{" "}
              &ldquo;{arrow.fromText}&rdquo; ({arrow.fromSection}) &rarr; &ldquo;{arrow.toText}
              &rdquo; ({arrow.toSection})
              {arrow.arrowStyle !== "solid" && (
                <span className="text-zinc-400"> [{arrow.arrowStyle}]</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
