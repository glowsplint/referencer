import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface TagFilterBarProps {
  allTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClearFilters: () => void;
}

export function TagFilterBar({
  allTags,
  activeTags,
  onToggleTag,
  onClearFilters,
}: TagFilterBarProps) {
  const { t } = useTranslation("management");

  if (allTags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="tagFilterBar">
      <span className="text-xs text-muted-foreground shrink-0">{t("hub.tagFilter")}:</span>
      {allTags.map((tag) => {
        const isActive = activeTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggleTag(tag)}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
            data-testid={`tagFilter-${tag}`}
          >
            #{tag}
          </button>
        );
      })}
      {activeTags.length > 0 && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid="clearTagFilters"
        >
          <X size={10} />
          {t("hub.clearTagFilters")}
        </button>
      )}
    </div>
  );
}
