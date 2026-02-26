// Core domain types for the annotation workspace: layers, highlights,
// arrows, underlines, word selections, editor settings, and undo/redo
// action commands.

export interface EditorSettings {
  isDarkMode: boolean;
  isLayersOn: boolean;
  isMultipleRowsLayout: boolean;
  isLocked: boolean;
  hideOffscreenArrows: boolean;
  showStatusBar: boolean;
  commentPlacement: "left" | "right" | "both";
  thirdEditorFullWidth: boolean;
}

export type ActiveTool = "selection" | "arrow" | "comments" | "highlight" | "underline" | "eraser";

export type DrawingPhase = "idle" | "selecting-anchor" | "anchor-confirmed";

export interface AnnotationSettings {
  activeTool: ActiveTool;
}

export type HighlightType = "highlight" | "comment";

export interface CommentReaction {
  emoji: string;
  userName: string;
}

export interface CommentReply {
  id: string;
  text: string;
  userName: string;
  timestamp: number;
  reactions: CommentReaction[];
}

export interface Highlight {
  id: string;
  editorIndex: number;
  from: number;
  to: number;
  text: string;
  annotation: string;
  type: HighlightType;
  lastEdited?: number;
  visible: boolean;
  userName?: string;
  replies?: CommentReply[];
  reactions?: CommentReaction[];
}

export interface LayerUnderline {
  id: string;
  editorIndex: number;
  from: number;
  to: number;
  text: string;
  visible: boolean;
}

export interface EditingAnnotation {
  layerId: string;
  highlightId: string;
}

export type ArrowStyle = "solid" | "dashed" | "dotted" | "double";

export interface Layer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  highlights: Highlight[];
  arrows: Arrow[];
  underlines: LayerUnderline[];
}

export interface ArrowEndpoint {
  editorIndex: number;
  from: number;
  to: number;
  text: string;
}

export interface Arrow {
  id: string;
  from: ArrowEndpoint;
  to: ArrowEndpoint;
  arrowStyle?: ArrowStyle;
  visible: boolean;
}

export interface DrawingState {
  anchor: ArrowEndpoint;
  cursor: ArrowEndpoint;
}

export interface WordSelection {
  editorIndex: number;
  from: number;
  to: number;
  text: string;
}

export interface ActionDetail {
  label: string;
  before?: string;
  after?: string;
}

export interface ActionEntry {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  undone: boolean;
  details?: ActionDetail[];
}

export interface ActionCommand {
  type: string;
  description: string;
  details?: ActionDetail[];
  undo: () => void;
  redo: () => void;
}
