// Thin bar at the top of the workspace that displays transient status messages
// (e.g., "PDF exported successfully"). Shows a green checkmark icon for success
// messages. Optionally displays the focused pane name and its editing/annotating
// state as a context prefix. Collapses to a minimal height when there is no
// active message and no pane context.
import { CheckCircle2 } from "lucide-react";
import type { StatusMessage } from "@/hooks/ui/use-status-message";

interface StatusBarProps {
  message: StatusMessage | null;
  paneName?: string;
  paneLocked?: boolean;
}

export function StatusBar({ message, paneName, paneLocked }: StatusBarProps) {
  const hasContext = paneName !== undefined;
  const contextPrefix = hasContext
    ? `${paneName} (${paneLocked ? "Annotating" : "Editing"})`
    : null;

  const hasContent = message || hasContext;

  return (
    <div
      data-testid="status-bar"
      className={`flex items-center gap-1.5 px-4 py-1 min-h-[30px] text-sm ${hasContent ? "border-b bg-muted/50 text-muted-foreground" : ""}`}
    >
      {contextPrefix && (
        <span data-testid="status-bar-context" className="text-muted-foreground/60">
          {contextPrefix}
          {message && " —"}
        </span>
      )}
      {message?.type === "success" && (
        <CheckCircle2 size={14} className="text-green-600 dark:text-green-400 shrink-0" />
      )}
      {message && <span>{message.text}</span>}
    </div>
  );
}
