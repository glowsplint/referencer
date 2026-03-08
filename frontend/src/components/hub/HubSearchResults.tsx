import { useMemo } from "react";
import { Highlighter, MessageSquareText, ArrowRight, Underline } from "lucide-react";
import { useTranslation } from "react-i18next";
import { highlightQueryInText } from "@/lib/highlight-query";
import type { SearchResult } from "@/lib/search-client";

const TYPE_ICONS: Record<string, React.ElementType> = {
  highlight: Highlighter,
  comment: MessageSquareText,
  arrow: ArrowRight,
  underline: Underline,
};

interface HubSearchResultsProps {
  results: SearchResult[];
  total: number;
  query: string;
  isLoading: boolean;
  error: Error | null;
  navigate: (hash: string) => void;
}

export function HubSearchResults({
  results,
  total,
  query,
  isLoading,
  error,
  navigate,
}: HubSearchResultsProps) {
  const { t } = useTranslation("management");

  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; results: SearchResult[] }>();
    for (const result of results) {
      const existing = map.get(result.document_id);
      if (existing) {
        existing.results.push(result);
      } else {
        map.set(result.document_id, {
          title: result.document_title || t("hub.untitled"),
          results: [result],
        });
      }
    }
    return map;
  }, [results, t]);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground mb-4" data-testid="hubSearchLoading">
        {t("hub.searchAnnotationsLoading")}
      </p>
    );
  }

  if (error) {
    return null;
  }

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground mb-4" data-testid="hubSearchEmpty">
        {t("hub.searchAnnotationsEmpty")}
      </p>
    );
  }

  return (
    <div className="mb-6" data-testid="hubSearchResults">
      <p className="text-sm text-muted-foreground mb-3">
        {t("hub.searchAnnotationCount", { count: total })}
      </p>
      <div className="flex flex-col gap-3">
        {[...grouped.entries()].map(([docId, group]) => (
          <div key={docId} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <button
                className="text-sm font-medium hover:underline cursor-pointer text-left"
                onClick={() => navigate(`#/${docId}`)}
              >
                {group.title}
              </button>
              <span className="text-xs text-muted-foreground">
                {t("hub.searchAnnotationCount", { count: group.results.length })}
              </span>
            </div>
            <div className="flex flex-col">
              {group.results.map((result) => {
                const Icon = TYPE_ICONS[result.annotation_type] ?? Highlighter;
                const displayText = result.annotation_text || result.selected_text;
                return (
                  <button
                    key={result.annotation_id}
                    className="flex items-center gap-2 px-2 py-1.5 text-left text-xs rounded hover:bg-accent cursor-pointer w-full"
                    onClick={() => navigate(`#/${result.document_id}`)}
                    data-testid={`hubSearchResult-${result.annotation_id}`}
                  >
                    <Icon size={12} className="shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{result.layer_name}</span>
                    <span className="truncate">{highlightQueryInText(displayText, query)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
