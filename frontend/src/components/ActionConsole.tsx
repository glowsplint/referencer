// Dev-facing action console that logs workspace mutations (add/remove layers,
// highlights, arrows, etc.) in a terminal-style panel at the bottom of the screen.
// Toggled with the backtick key. Useful for debugging annotation state changes.
import { useRef, useEffect, useCallback } from "react"
import type { ActionEntry, ActionDetail } from "@/types/editor"

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

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i

function ColorSwatch({ color }: { color: string }) {
  return (
    <span
      data-testid="colorSwatch"
      className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1"
      style={{ backgroundColor: color }}
    />
  )
}

function DetailValue({ value }: { value: string }) {
  return (
    <>
      {HEX_COLOR_RE.test(value) && <ColorSwatch color={value} />}
      <span className="text-zinc-400">{value}</span>
    </>
  )
}

function DetailLine({ detail }: { detail: ActionDetail }) {
  const { label, before, after } = detail
  return (
    <div className="pl-6 text-zinc-500" data-testid="actionDetail">
      <span>{label}: </span>
      {before != null && after != null ? (
        <>
          <DetailValue value={before} />
          <span className="text-zinc-600"> → </span>
          <DetailValue value={after} />
        </>
      ) : before != null ? (
        <DetailValue value={before} />
      ) : after != null ? (
        <DetailValue value={after} />
      ) : null}
    </div>
  )
}

interface ActionConsoleProps {
  log: ActionEntry[]
  isOpen: boolean
  onClose: () => void
  height: number
  onHeightChange: (height: number) => void
}

export function ActionConsole({ log, isOpen, onClose, height, onHeightChange }: ActionConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [log])

  // Drag-to-resize: tracks mouse delta from the top edge drag handle,
  // clamped between 80px and 600px. Disables text selection during drag.
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      document.body.style.userSelect = "none"
      const startY = e.clientY
      const startHeight = height

      const onMouseMove = (e: MouseEvent) => {
        const delta = startY - e.clientY
        const newHeight = Math.min(600, Math.max(80, startHeight + delta))
        onHeightChange(newHeight)
      }

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        document.body.style.userSelect = ""
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [height, onHeightChange]
  )

  if (!isOpen) return null

  return (
    <div
      data-testid="actionConsole"
      className="bg-zinc-900 border-t border-zinc-700 flex flex-col font-mono text-xs shrink-0"
      style={{ height }}
    >
      <div
        data-testid="consoleDragHandle"
        onMouseDown={handleDragStart}
        className="h-1.5 cursor-row-resize hover:bg-zinc-600 transition-colors shrink-0"
      />
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
          <div key={entry.id} className={entry.undone ? "opacity-40 line-through" : ""}>
            <div className="py-0.5 flex gap-2">
              <span className="text-zinc-600 shrink-0">{formatTime(entry.timestamp)}</span>
              <span className={`shrink-0 ${TYPE_COLORS[entry.type] ?? "text-zinc-400"}`}>
                [{entry.type}]
              </span>
              <span className="text-zinc-300">{entry.description}</span>
            </div>
            {entry.details?.map((detail, i) => (
              <DetailLine key={i} detail={detail} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
