export interface EditorSettings {
  isDarkMode: boolean
  isLayersOn: boolean
  isMultipleRowsLayout: boolean
  isLocked: boolean
}

export interface AnnotationSettings {
  isPainterMode: boolean
}

export interface Highlight {
  id: string
  editorIndex: number
  from: number
  to: number
  text: string
}

export interface Layer {
  id: string
  name: string
  color: string
  highlights: Highlight[]
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
