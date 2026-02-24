import { useState } from "react";
import { X } from "lucide-react";
import type { CommentReply } from "@/types/editor";
import { migrateAnnotation } from "@/lib/annotation/migrate-annotation";
import { formatRelativeTime } from "@/lib/annotation/format-relative-time";
import { ReactionBar } from "./ReactionBar";

interface ReplyThreadProps {
  replies: CommentReply[];
  currentUserName: string;
  onRemoveReply: (replyId: string) => void;
  onToggleReplyReaction: (replyId: string, emoji: string) => void;
}

const COLLAPSED_LIMIT = 3;

/** Renders a threaded reply list with optional collapse when > 3 replies. */
export function ReplyThread({
  replies,
  currentUserName,
  onRemoveReply,
  onToggleReplyReaction,
}: ReplyThreadProps) {
  const [expanded, setExpanded] = useState(false);

  if (replies.length === 0) return null;

  const canCollapse = replies.length > COLLAPSED_LIMIT;
  const visible = canCollapse && !expanded ? replies.slice(-COLLAPSED_LIMIT) : replies;
  const hiddenCount = replies.length - visible.length;

  return (
    <div className="border-l-2 border-zinc-200 dark:border-zinc-600 ml-2 pl-2 py-1">
      {canCollapse && !expanded && (
        <button
          className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mb-1"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
        >
          Show {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
        </button>
      )}
      {visible.map((reply) => (
        <div key={reply.id} className="group/reply mb-1.5 last:mb-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              {reply.userName}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {formatRelativeTime(reply.timestamp)}
            </span>
            <button
              className="ml-auto p-0.5 rounded opacity-0 group-hover/reply:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveReply(reply.id);
              }}
              title="Remove reply"
            >
              <X size={10} />
            </button>
          </div>
          <div
            className="text-xs text-zinc-600 dark:text-zinc-300 prose-xs"
            dangerouslySetInnerHTML={{ __html: migrateAnnotation(reply.text) }}
          />
          {reply.reactions.length > 0 && (
            <ReactionBar
              reactions={reply.reactions}
              currentUserName={currentUserName}
              onToggleReaction={(emoji) => onToggleReplyReaction(reply.id, emoji)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
