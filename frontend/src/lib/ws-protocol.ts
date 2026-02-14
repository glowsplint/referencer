export interface ArrowEndpointPayload {
  editorIndex: number
  from: number
  to: number
  text: string
}

export interface HighlightPayload {
  id: string
  editorIndex: number
  from: number
  to: number
  text: string
  annotation: string
  type?: string
}

export interface ArrowPayload {
  id: string
  from: ArrowEndpointPayload
  to: ArrowEndpointPayload
}

export interface LayerPayload {
  id: string
  name: string
  color: string
  visible: boolean
  arrowStyle?: string
  highlights: HighlightPayload[]
  arrows: ArrowPayload[]
}

export interface EditorPayload {
  index: number
  name: string
  visible: boolean
  contentJson: unknown | null
}

export interface WorkspaceStatePayload {
  workspaceId: string
  layers: LayerPayload[]
  editors: EditorPayload[]
}

export interface ClientMessage {
  type: string
  payload: Record<string, unknown>
  requestId?: string
}

export interface ServerMessage {
  type: "state" | "action" | "ack" | "error"
  payload: Record<string, unknown>
  sourceClientId?: string
  requestId?: string
}

export type ActionType =
  | "addLayer"
  | "removeLayer"
  | "updateLayerName"
  | "updateLayerColor"
  | "toggleLayerVisibility"
  | "reorderLayers"
  | "addHighlight"
  | "removeHighlight"
  | "updateHighlightAnnotation"
  | "addArrow"
  | "removeArrow"
  | "addEditor"
  | "removeEditor"
  | "reorderEditors"
  | "updateSectionName"
  | "toggleSectionVisibility"
  | "updateLayerArrowStyle"
  | "updateEditorContent"
