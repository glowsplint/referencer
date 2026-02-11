export interface EditorSettings {
  isDarkMode: boolean
  isLayersOn: boolean
  isMultipleRowsLayout: boolean
  isLocked: boolean
}

export type ActiveTool = "selection" | "arrow" | "comments"

export interface AnnotationSettings {
  activeTool: ActiveTool
}

export interface Highlight {
  id: string
  editorIndex: number
  from: number
  to: number
  text: string
  annotation: string
}

export interface EditingAnnotation {
  layerId: string
  highlightId: string
}

export interface Layer {
  id: string
  name: string
  color: string
  visible: boolean
  highlights: Highlight[]
  arrows: Arrow[]
}

export interface ArrowEndpoint {
  editorIndex: number
  from: number
  to: number
  text: string
}

export interface Arrow {
  id: string
  from: ArrowEndpoint
  to: ArrowEndpoint
}

export interface DrawingState {
  anchor: ArrowEndpoint
  cursor: ArrowEndpoint
}

export interface WordSelection {
  editorIndex: number
  from: number
  to: number
  text: string
}

export interface ActionEntry {
  id: string
  type: string
  description: string
  timestamp: number
  undone: boolean
}

export interface ActionCommand {
  type: string
  description: string
  undo: () => void
  redo: () => void
}

export const TAILWIND_300_COLORS = [
  "#fca5a5", // red-300
  "#fcd34d", // amber-300
  "#bef264", // lime-300
  "#6ee7b7", // emerald-300
  "#67e8f9", // cyan-300
  "#93c5fd", // blue-300
  "#c4b5fd", // violet-300
  "#f0abfc", // fuchsia-300
  "#fda4af", // rose-300
  "#d4d4d8", // zinc-300
]
