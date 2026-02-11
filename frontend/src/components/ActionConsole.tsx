import { useRef, useEffect } from "react"
import type { ActionEntry } from "@/types/editor"

const TYPE_COLORS: Record<string, string> = {
  addLayer: "text-emerald-400",
  removeLayer: "text-red-400",
  showLayer: "text-emerald-400",
  hideLayer: "text-red-400",
  addHighlight: "text-cyan-400",
  removeHighlight: "text-orange-400",
  addArrow: "text-blue-400",
  removeArrow: "text-orange-400",
  updateLayerName: "text-violet-400",
  updateLayerColor: "text-violet-400",
  addEditor: "text-emerald-400",
  removeEditor: "text-red-400",
  showPassage: "text-emerald-400",
  hidePassage: "text-red-400",
  updateAnnotation: "text-yellow-400",
  lock: "text-yellow-400",
  unlock: "text-yellow-400",
  setActiveTool: "text-blue-400",
  toggleDarkMode: "text-zinc-300",
  toggleLayout: "text-zinc-300",
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

interface ActionConsoleProps {
  log: ActionEntry[]
  isOpen: boolean
  onClose: () => void
}

export function ActionConsole({ log, isOpen, onClose }: ActionConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [log])

  if (!isOpen) return null

  return (
    <div
      data-testid="actionConsole"
      className="fixed bottom-0 left-0 right-0 h-48 z-50 bg-zinc-900 border-t border-zinc-700 flex flex-col font-mono text-xs"
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-700">
        <span className="text-zinc-400 text-xs font-medium">Action Console</span>
        <button
          data-testid="actionConsoleClose"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
        >
          close
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1">
        {log.length === 0 && (
          <div className="text-zinc-600 py-2">No actions recorded yet.</div>
        )}
        {log.map((entry) => (
          <div
            key={entry.id}
            className={`py-0.5 flex gap-2 ${entry.undone ? "opacity-40 line-through" : ""}`}
          >
            <span className="text-zinc-600 shrink-0">{formatTime(entry.timestamp)}</span>
            <span className={`shrink-0 ${TYPE_COLORS[entry.type] ?? "text-zinc-400"}`}>
              [{entry.type}]
            </span>
            <span className="text-zinc-300">{entry.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
