import { useMemo } from "react";
import { Highlighter, MessageSquareText, ArrowRight, Underline } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sanitizeColor } from "@/lib/sanitize-color";
import { highlightQueryInText } from "@/lib/highlight-query";
import type { AnnotationSearchMatch, AnnotationMatchType } from "@/types/editor";

const TYPE_ICONS: Record<AnnotationMatchType, React.ElementType> = {
  highlight: Highlighter,
  comment: MessageSquareText,
  arrow: ArrowRight,
  underline: Underline,
};

interface AnnotationSearchResultsProps {
  matches: AnnotationSearchMatch[];
  query: string;
  onResultClick: (match: AnnotationSearchMatch) => void;
}

export function AnnotationSearchResults({
  matches,
  query,
  onResultClick,
}: AnnotationSearchResultsProps) {
  const { t } = useTranslation("management");

  const grouped = useMemo(() => {
    const map = new Map<string, AnnotationSearchMatch[]>();
    for (const match of matches) {
      const existing = map.get(match.layerId);
      if (existing) {
        existing.push(match);
      } else {
        map.set(match.layerId, [match]);
      }
    }
    return map;
  }, [matches]);

  if (matches.length === 0) {
    return <p className="text-xs text-muted-foreground px-1">{t("search.noResults")}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground px-1">
        {t("search.resultCount", { count: matches.length })}
      </p>
      {[...grouped.entries()].map(([layerId, layerMatches]) => {
        const first = layerMatches[0];
        return (
          <div key={layerId}>
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: sanitizeColor(first.layerColor) }}
              />
              <span className="text-xs font-medium text-muted-foreground truncate">
                {first.layerName}
              </span>
            </div>
            <div className="flex flex-col">
              {layerMatches.map((match) => {
                const Icon = TYPE_ICONS[match.annotationType];
                return (
                  <button
                    key={match.annotationId}
                    className="flex items-center gap-1.5 px-2 py-1 text-left text-xs rounded hover:bg-accent cursor-pointer w-full"
                    onClick={() => onResultClick(match)}
                    data-testid={`searchResult-${match.annotationId}`}
                  >
                    <Icon size={12} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {highlightQueryInText(match.displayText, query)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
