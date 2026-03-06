// Thin bar at the top of the document that displays transient status messages
// (e.g., "PDF exported successfully"). Shows a green checkmark icon for success
// messages. Collapses to a minimal height when there is no active message.
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { StatusMessage } from "@/hooks/ui/use-status-message";

interface StatusBarProps {
  message: StatusMessage | null;
}

export function StatusBar({ message }: StatusBarProps) {
  return (
    <div
      data-testid="status-bar"
      className={`flex items-center gap-1.5 px-4 py-1 min-h-[30px] text-sm ${message ? "border-b bg-muted/50 text-muted-foreground" : ""}`}
    >
      {message?.type === "success" && (
        <CheckCircle2 size={14} className="text-green-600 dark:text-green-400 shrink-0" />
      )}
      {message?.type === "error" && (
        <AlertCircle size={14} className="text-red-600 dark:text-red-400 shrink-0" />
      )}
      {message && (
        <span className={message.type === "error" ? "text-red-600 dark:text-red-400" : ""}>
          {message.text}
        </span>
      )}
    </div>
  );
}
