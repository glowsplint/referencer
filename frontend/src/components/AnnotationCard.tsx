// Individual annotation card shown in the AnnotationPanel beside the editor.
// Displays a colored top border matching its layer color, with a rich text
// mini-editor for editing or a static HTML view. Positioned absolutely by the parent panel.
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown } from "lucide-react";
import { MiniCommentEditor } from "./MiniCommentEditor";
import { migrateAnnotation } from "../utils/migrateAnnotation";

function formatRelativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

interface AnnotationCardProps {
  layerId: string;
  highlightId: string;
  color: string;
  annotation: string;
  isEditing: boolean;
  top: number;
  onChange: (layerId: string, highlightId: string, annotation: string) => void;
  onBlur: (layerId: string, highlightId: string, annotation: string) => void;
  onClick: (layerId: string, highlightId: string) => void;
  cardRef?: (el: HTMLDivElement | null) => void;
  lastEdited?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: (highlightId: string) => void;
}

export function AnnotationCard({
  layerId,
  highlightId,
  color,
  annotation,
  isEditing,
  top,
  onChange,
  onBlur,
  onClick,
  cardRef,
  lastEdited,
  isCollapsed,
  onToggleCollapse,
}: AnnotationCardProps) {
  const { t } = useTranslation("management");

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEditing) {
        onClick(layerId, highlightId);
      }
    },
    [isEditing, layerId, highlightId, onClick],
  );

  return (
    <div
      ref={cardRef}
      data-highlight-id={highlightId}
      className={`absolute w-48 rounded border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800 group ${isCollapsed ? "cursor-pointer" : ""}`}
      style={{ top }}
      onClick={isCollapsed ? () => onToggleCollapse?.(highlightId) : handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div className="h-1 rounded-t" style={{ backgroundColor: color }} />
      {isCollapsed ? (
        <div className="flex items-center justify-center h-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronDown size={10} className="text-zinc-400" />
        </div>
      ) : (
        <>
          {onToggleCollapse && (
            <button
              className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 z-10"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(highlightId);
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <ChevronUp size={10} />
            </button>
          )}
          {isEditing ? (
            <MiniCommentEditor
              value={annotation}
              onChange={(html) => onChange(layerId, highlightId, html)}
              onBlur={() => onBlur(layerId, highlightId, annotation)}
              placeholder={t("annotations.placeholder")}
              autoFocus
            />
          ) : annotation ? (
            <div
              className="cursor-pointer p-2 text-xs text-zinc-600 dark:text-zinc-300 min-h-[2rem] prose-xs"
              onClick={handleClick}
              dangerouslySetInnerHTML={{ __html: migrateAnnotation(annotation) }}
            />
          ) : (
            <div
              className="cursor-pointer p-2 text-xs text-zinc-600 dark:text-zinc-300 min-h-[2rem]"
              onClick={handleClick}
            >
              <span className="text-zinc-400 italic">{t("annotations.placeholder")}</span>
            </div>
          )}
          {lastEdited && (
            <div className="px-2 pb-1 text-[10px] text-zinc-400">
              {formatRelativeTime(lastEdited)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
