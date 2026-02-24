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

  return (
    <div
      ref={cardRef}
      data-highlight-id={highlightId}
      className={`absolute w-full rounded border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800 group ${isCollapsed ? "cursor-pointer" : ""}`}
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
          {/* Reactions */}
          {reactions && reactions.length > 0 && currentUserName && (
            <ReactionBar
              reactions={reactions}
              currentUserName={currentUserName}
              onToggleReaction={handleEmojiSelect}
            />
          )}
          {/* Quick emoji picker + full picker */}
          {onToggleReaction && (
            <EmojiPickerPopover
              open={emojiPickerOpen}
              onOpenChange={setEmojiPickerOpen}
              onSelect={handleEmojiSelect}
            >
              <span />
            </EmojiPickerPopover>
          )}
          {onToggleReaction && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <QuickEmojiPicker
                onSelect={handleEmojiSelect}
                onOpenFull={() => setEmojiPickerOpen(true)}
              />
            </div>
          )}
          {/* Reply thread */}
          {replies && replies.length > 0 && currentUserName && (
            <ReplyThread
              replies={replies}
              currentUserName={currentUserName}
              onRemoveReply={handleRemoveReply}
              onToggleReplyReaction={handleToggleReplyReaction}
            />
          )}
          {/* Reply input */}
          {onAddReply && <ReplyInput onSubmit={handleAddReply} />}
          {/* Timestamp fallback when no header */}
          {!userName && !lastEdited ? null : null}
        </>
      )}
    </div>
  );
}
