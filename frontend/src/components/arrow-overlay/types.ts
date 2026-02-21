// Shared types for the ArrowOverlay component family.
import type { Layer, DrawingState, ActiveTool, ArrowStyle, Arrow } from "@/types/editor";
import type { Editor } from "@tiptap/react";

export interface ArrowOverlayProps {
  layers: Layer[];
  drawingState: DrawingState | null;
  drawingColor: string | null;
  editorsRef: React.RefObject<Map<number, Editor>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  removeArrow: (layerId: string, arrowId: string) => void;
  selectedArrow: { layerId: string; arrowId: string } | null;
  setSelectedArrow: (arrow: { layerId: string; arrowId: string } | null) => void;
  activeTool: ActiveTool;
  sectionVisibility: boolean[];
  isDarkMode: boolean;
  isLocked: boolean;
  hideOffscreenArrows: boolean;
}

export interface CrossEditorArrow {
  layerId: string;
  arrowId: string;
  color: string;
  arrowStyle: ArrowStyle;
  arrow: Arrow;
}
