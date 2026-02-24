import type { CommentReaction } from "@/types/editor";

interface ReactionBarProps {
  reactions: CommentReaction[];
  currentUserName: string;
  onToggleReaction: (emoji: string) => void;
}

/** Renders grouped reaction pills showing emoji + count, highlighted when the current user has reacted. */
export function ReactionBar({ reactions, currentUserName, onToggleReaction }: ReactionBarProps) {
  if (reactions.length === 0) return null;

  // Group reactions by emoji
  const grouped = new Map<string, string[]>();
  for (const r of reactions) {
    const users = grouped.get(r.emoji) ?? [];
    users.push(r.userName);
    grouped.set(r.emoji, users);
  }

  return (
    <div className="inline-flex flex-wrap gap-1 px-2 py-1">
      {[...grouped.entries()].map(([emoji, users]) => {
        const isMine = users.includes(currentUserName);
        return (
          <button
            key={emoji}
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs border transition-colors ${
              isMine
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500"
                : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700/50 dark:hover:bg-zinc-700"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleReaction(emoji);
            }}
            title={users.join(", ")}
          >
            <span>{emoji}</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{users.length}</span>
          </button>
        );
      })}
    </div>
  );
}
