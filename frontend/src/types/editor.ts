// Core domain types for the annotation document: layers, highlights,
// arrows, underlines, word selections, editor settings, and undo/redo
// action commands.

export type Theme = "auto" | "light" | "dark" | "sepia" | "high-contrast";

export interface EditorSettings {
  theme: Theme;
  isLayersOn: boolean;
  isMultipleRowsLayout: boolean;
  lockedPanes: Record<number, boolean>;
  hideOffscreenArrows: boolean;
  showStatusBar: boolean;
  overscroll: boolean;
  commentPlacement: "left" | "right" | "both";
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

export type AnnotationMatchType = "highlight" | "comment" | "arrow" | "underline";

export interface AnnotationSearchMatch {
  layerId: string;
  layerName: string;
  layerColor: string;
  annotationType: AnnotationMatchType;
  annotationId: string;
  displayText: string;
  editorIndex: number;
  from: number;
  to: number;
}

// ---------------------------------------------------------------------------
// Hook return types
// ---------------------------------------------------------------------------

export interface UseYjsLayersReturn {
  layers: Layer[];
  activeLayerId: string | null;
  addLayer: (opts?: {
    id?: string;
    name?: string;
    color?: string;
    extraColors?: string[];
  }) => { id: string; name: string } | null;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  updateLayerColor: (id: string, color: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleAllLayerVisibility: () => void;
  updateLayerName: (id: string, name: string) => void;
  addHighlight: (
    layerId: string,
    highlight: Omit<Highlight, "id" | "visible">,
    opts?: { id?: string },
  ) => string;
  removeHighlight: (layerId: string, highlightId: string) => void;
  updateHighlightAnnotation: (layerId: string, highlightId: string, annotation: string) => void;
  clearLayerHighlights: (layerId: string) => void;
  addArrow: (
    layerId: string,
    arrow: Omit<Arrow, "id" | "visible">,
    opts?: { id?: string },
  ) => string;
  removeArrow: (layerId: string, arrowId: string) => void;
  updateArrowStyle: (layerId: string, arrowId: string, arrowStyle: ArrowStyle) => void;
  clearLayerArrows: (layerId: string) => void;
  addUnderline: (
    layerId: string,
    underline: Omit<LayerUnderline, "id" | "visible">,
    opts?: { id?: string },
  ) => string;
  removeUnderline: (layerId: string, underlineId: string) => void;
  clearLayerUnderlines: (layerId: string) => void;
  toggleHighlightVisibility: (layerId: string, highlightId: string) => void;
  toggleArrowVisibility: (layerId: string, arrowId: string) => void;
  toggleUnderlineVisibility: (layerId: string, underlineId: string) => void;
  addReply: (layerId: string, highlightId: string, reply: CommentReply) => void;
  updateReply: (layerId: string, highlightId: string, replyId: string, text: string) => void;
  removeReply: (layerId: string, highlightId: string, replyId: string) => void;
  toggleReactionOnHighlight: (
    layerId: string,
    highlightId: string,
    emoji: string,
    userName: string,
  ) => void;
  toggleReactionOnReply: (
    layerId: string,
    highlightId: string,
    replyId: string,
    emoji: string,
    userName: string,
  ) => void;
  setActiveLayerId: React.Dispatch<React.SetStateAction<string | null>>;
}
