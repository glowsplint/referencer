// Core domain types for the annotation workspace: layers, highlights,
// arrows, underlines, word selections, editor settings, and undo/redo
// action commands. Also exports the Tailwind 300-shade color palette
// used for layer colors.

export interface EditorSettings {
  isDarkMode: boolean
  isLayersOn: boolean
  isMultipleRowsLayout: boolean
  isLocked: boolean
  showDrawingToasts: boolean
  showCommentsToasts: boolean
  showHighlightToasts: boolean
  overscrollEnabled: boolean
}

export type ActiveTool = "selection" | "arrow" | "comments" | "highlight" | "underline" | "eraser"

export type DrawingPhase = "idle" | "selecting-anchor" | "anchor-confirmed"

export interface AnnotationSettings {
  activeTool: ActiveTool
}

export type HighlightType = "highlight" | "comment"

export interface Highlight {
  id: string
  editorIndex: number
  from: number
  to: number
  text: string
  annotation: string
  type: HighlightType
}

export interface LayerUnderline {
  id: string
  editorIndex: number
  from: number
  to: number
  text: string
}

export interface EditingAnnotation {
  layerId: string
  highlightId: string
}

export type ArrowStyle = "solid" | "dashed" | "dotted" | "double"

export interface Layer {
  id: string
  name: string
  color: string
  visible: boolean
  highlights: Highlight[]
  arrows: Arrow[]
  underlines: LayerUnderline[]
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
  arrowStyle?: ArrowStyle
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

export interface ActionDetail {
  label: string
  before?: string
  after?: string
}

export interface ActionEntry {
  id: string
  type: string
  description: string
  timestamp: number
  undone: boolean
  details?: ActionDetail[]
}

export interface ActionCommand {
  type: string
  description: string
  details?: ActionDetail[]
  undo: () => void
  redo: () => void
}

export const TAILWIND_300_COLORS = [
  "#fca5a5", // red-300
  "#fdba74", // orange-300
  "#fcd34d", // amber-300
  "#fde047", // yellow-300
  "#bef264", // lime-300
  "#86efac", // green-300
  "#6ee7b7", // emerald-300
  "#5eead4", // teal-300
  "#67e8f9", // cyan-300
  "#7dd3fc", // sky-300
  "#93c5fd", // blue-300
  "#a5b4fc", // indigo-300
  "#c4b5fd", // violet-300
  "#d8b4fe", // purple-300
  "#f0abfc", // fuchsia-300
  "#f9a8d4", // pink-300
  "#fda4af", // rose-300
  "#d4d4d8", // zinc-300
]
