// Individual annotation card shown in the AnnotationPanel beside the editor.
// Displays a colored top border matching its layer color, with a rich text
// mini-editor for editing or a static HTML view. Positioned absolutely by the parent panel.
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { CommentReply, CommentReaction } from "@/types/editor";
import { MiniCommentEditor } from "./MiniCommentEditor";
import { ReactionBar } from "./annotations/ReactionBar";
import { QuickEmojiPicker } from "./annotations/QuickEmojiPicker";
import { EmojiPickerPopover } from "./annotations/EmojiPickerPopover";
import { ReplyThread } from "./annotations/ReplyThread";
import { ReplyInput } from "./annotations/ReplyInput";
import { migrateAnnotation } from "@/lib/annotation/migrate-annotation";
import { formatRelativeTime } from "@/lib/annotation/format-relative-time";
import { getPlainPreview } from "@/lib/annotation/get-plain-preview";
import { sanitizeColor } from "@/lib/sanitize-color";

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
  userName?: string;
  replies?: CommentReply[];
  reactions?: CommentReaction[];
  currentUserName?: string;
  onAddReply?: (layerId: string, highlightId: string, text: string) => void;
  onRemoveReply?: (layerId: string, highlightId: string, replyId: string) => void;
  onToggleReaction?: (layerId: string, highlightId: string, emoji: string) => void;
  onToggleReplyReaction?: (
    layerId: string,
    highlightId: string,
    replyId: string,
    emoji: string,
  ) => void;
  readOnly?: boolean;
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
  userName,
  replies,
  reactions,
  currentUserName,
  onAddReply,
  onRemoveReply,
  onToggleReaction,
  onToggleReplyReaction,
  readOnly,
}: AnnotationCardProps) {
  const { t } = useTranslation("management");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEditing) {
        onClick(layerId, highlightId);
      }
    },
    [isEditing, layerId, highlightId, onClick],
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      onToggleReaction?.(layerId, highlightId, emoji);
    },
    [layerId, highlightId, onToggleReaction],
  );

  const handleAddReply = useCallback(
    (text: string) => {
      onAddReply?.(layerId, highlightId, text);
    },
    [layerId, highlightId, onAddReply],
  );

  const handleRemoveReply = useCallback(
    (replyId: string) => {
      onRemoveReply?.(layerId, highlightId, replyId);
    },
    [layerId, highlightId, onRemoveReply],
  );

  const handleToggleReplyReaction = useCallback(
    (replyId: string, emoji: string) => {
      onToggleReplyReaction?.(layerId, highlightId, replyId, emoji);
    },
    [layerId, highlightId, onToggleReplyReaction],
  );

  // In read-only mode: collapse/expand still works, but clicking does NOT trigger editing
  const handleCardClick = readOnly
    ? isCollapsed
      ? () => onToggleCollapse?.(highlightId)
      : undefined
    : isCollapsed
      ? () => onToggleCollapse?.(highlightId)
      : handleClick;

  const handleCardKeyDown = readOnly
    ? isCollapsed
      ? (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleCollapse?.(highlightId);
          }
        }
      : undefined
    : (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isCollapsed) {
            onToggleCollapse?.(highlightId);
          } else {
            onClick(layerId, highlightId);
          }
        }
      };

  return (
    <div
      ref={cardRef}
      data-highlight-id={highlightId}
      role={readOnly && !isCollapsed ? undefined : "button"}
      tabIndex={readOnly && !isCollapsed ? undefined : 0}
      className={`absolute w-full rounded border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800 group ${isCollapsed ? "cursor-pointer" : ""}`}
      style={{ top }}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div className="h-1 rounded-t" style={{ backgroundColor: sanitizeColor(color) }} />
      {isCollapsed ? (
        <div className="flex items-center gap-1 px-2 py-1 min-h-[1.25rem]">
          <span className="flex-1 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            {annotation ? (
              getPlainPreview(annotation)
            ) : (
              <span className="italic text-zinc-400 dark:text-zinc-500">
                {t("annotations.placeholder")}
              </span>
            )}
          </span>
          <ChevronDown
            size={10}
            className="shrink-0 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
          />
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
          {/* Header row: userName + timestamp */}
          {(userName || lastEdited) && (
            <div className="flex items-center gap-1 px-2 pt-1.5">
              {userName && (
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  {userName}
                </span>
              )}
              {lastEdited && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {formatRelativeTime(lastEdited)}
                </span>
              )}
            </div>
          )}
          {/* In read-only mode, never show the editor — always static view */}
          {!readOnly && isEditing ? (
            <MiniCommentEditor
              value={annotation}
              onChange={(html) => onChange(layerId, highlightId, html)}
              onBlur={() => onBlur(layerId, highlightId, annotation)}
              placeholder={t("annotations.placeholder")}
              autoFocus
            />
          ) : annotation ? (
            <div
              role={readOnly ? undefined : "button"}
              tabIndex={readOnly ? undefined : 0}
              className={`${readOnly ? "" : "cursor-pointer "}p-2 text-xs text-zinc-600 dark:text-zinc-300 min-h-[2rem] prose-xs`}
              onClick={readOnly ? undefined : handleClick}
              onKeyDown={
                readOnly
                  ? undefined
                  : (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onClick(layerId, highlightId);
                      }
                    }
              }
              dangerouslySetInnerHTML={{ __html: migrateAnnotation(annotation) }}
            />
          ) : (
            <div
              role={readOnly ? undefined : "button"}
              tabIndex={readOnly ? undefined : 0}
              className={`${readOnly ? "" : "cursor-pointer "}p-2 text-xs text-zinc-600 dark:text-zinc-300 min-h-[2rem]`}
              onClick={readOnly ? undefined : handleClick}
              onKeyDown={
                readOnly
                  ? undefined
                  : (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onClick(layerId, highlightId);
                      }
                    }
              }
            >
              <span className="text-zinc-400 italic">{t("annotations.placeholder")}</span>
            </div>
          )}
          {/* Reactions — always show existing reactions, but read-only hides toggle interaction */}
          {reactions && reactions.length > 0 && currentUserName && (
            <ReactionBar
              reactions={reactions}
              currentUserName={currentUserName}
              onToggleReaction={readOnly ? undefined : handleEmojiSelect}
            />
          )}
          {/* Quick emoji picker + full picker — hidden in read-only mode */}
          {!readOnly && onToggleReaction && (
            <EmojiPickerPopover
              open={emojiPickerOpen}
              onOpenChange={setEmojiPickerOpen}
              onSelect={handleEmojiSelect}
            >
              <span />
            </EmojiPickerPopover>
          )}
          {!readOnly && onToggleReaction && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <QuickEmojiPicker
                onSelect={handleEmojiSelect}
                onOpenFull={() => setEmojiPickerOpen(true)}
              />
            </div>
          )}
          {/* Reply thread — always show existing replies, but read-only hides remove/reaction actions */}
          {replies && replies.length > 0 && currentUserName && (
            <ReplyThread
              replies={replies}
              currentUserName={currentUserName}
              onRemoveReply={readOnly ? undefined : handleRemoveReply}
              onToggleReplyReaction={readOnly ? undefined : handleToggleReplyReaction}
            />
          )}
          {/* Reply input — hidden in read-only mode */}
          {!readOnly && onAddReply && <ReplyInput onSubmit={handleAddReply} />}
          {/* Timestamp fallback when no header */}
          {!userName && !lastEdited ? null : null}
        </>
      )}
    </div>
  );
}
