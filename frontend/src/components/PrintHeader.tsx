import { useTranslation } from "react-i18next";
import type { Layer } from "@/types/editor";
import { sanitizeColor } from "@/lib/sanitize-color";

export interface AnnotationCounts {
  comments: number;
  highlights: number;
  underlines: number;
  connections: number;
}

interface PrintHeaderProps {
  title: string;
  layers: Layer[];
  annotationCounts?: AnnotationCounts;
}

export function PrintHeader({ title, layers, annotationCounts }: PrintHeaderProps) {
  const { t } = useTranslation();
  const visibleLayers = layers.filter((l) => l.visible);
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const counts = annotationCounts ?? { comments: 0, highlights: 0, underlines: 0, connections: 0 };

  const parts: string[] = [];
  if (counts.comments > 0) {
    parts.push(t("print.commentCount", { count: counts.comments }));
  }
  if (counts.highlights > 0) {
    parts.push(t("print.highlightCount", { count: counts.highlights }));
  }
  if (counts.underlines > 0) {
    parts.push(t("print.underlineCount", { count: counts.underlines }));
  }
  if (counts.connections > 0) {
    parts.push(t("print.connectionCount", { count: counts.connections }));
  }

  const summary = parts.join(" \u00b7 ");

  return (
    <div className="hidden print:block mb-8 pb-4 border-b-2 border-zinc-300 print-header">
      <h1 className="text-3xl font-bold text-center mb-2">{title}</h1>
      <p className="text-sm text-center text-zinc-500 mb-4">{dateStr}</p>
      {visibleLayers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {visibleLayers.map((layer) => (
            <div key={layer.id} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block w-3 h-3 rounded-full border border-zinc-400"
                style={{ backgroundColor: sanitizeColor(layer.color) }}
              />
              <span>{layer.name}</span>
            </div>
          ))}
        </div>
      )}
      {summary && (
        <div className="print-annotation-counts text-xs text-center text-zinc-500 mt-2">
          {t("print.annotationSummary", { summary })}
        </div>
      )}
    </div>
  );
}
