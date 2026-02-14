import { CheckCircle2 } from "lucide-react"
import type { StatusMessage } from "@/hooks/use-status-message"

interface StatusBarProps {
  message: StatusMessage | null
}

export function StatusBar({ message }: StatusBarProps) {
  return (
    <div
      data-testid="status-bar"
      className={`flex items-center gap-1.5 px-3 py-1 min-h-[30px] text-xs ${message ? "border-b bg-muted/50 text-muted-foreground" : ""}`}
    >
      {message?.type === "success" && (
        <CheckCircle2 size={12} className="text-green-600 dark:text-green-400 shrink-0" />
      )}
      {message && <span>{message.text}</span>}
    </div>
  )
}
