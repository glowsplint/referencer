// Handles the "comments" annotation tool mode. Shows status prompts on entry,
// and on Enter creates a comment highlight at the current word selection
// (or toggles it off if one already exists at that range).
// Refs are used extensively to keep the confirmComment callback stable.
import i18n from "@/i18n";
import type { ActiveTool, WordSelection } from "@/types/editor";
import type { StatusMessage } from "@/hooks/ui/use-status-message";
import {
  useAnnotationToolMode,
  type AnnotationToolConfig,
  type AnnotationItem,
} from "@/hooks/tools/use-annotation-tool-mode";
import { useLatestRef } from "@/hooks/utilities/use-latest-ref";

interface CommentHighlightItem extends AnnotationItem {
  annotation: string;
  type: "highlight" | "comment";
}

interface CommentLayer {
  id: string;
  highlights: CommentHighlightItem[];
}

function createCommentConfig(removeHighlightRef: {
  current: (layerId: string, highlightId: string) => void;
}): AnnotationToolConfig<CommentLayer> {
  return {
    toolName: "comments",
    i18nKey: "comments",
    getItems: (layer) => layer.highlights,
    findExisting: (items, sel) =>
      items.find(
        (h) =>
          h.editorIndex === sel.editorIndex &&
          ((h.from === sel.from && h.to === sel.to) || h.text === sel.text),
      ),
    buildPayload: (sel: WordSelection) => ({
      editorIndex: sel.editorIndex,
      from: sel.from,
      to: sel.to,
      text: sel.text,
      annotation: "",
      type: "comment" as const,
    }),
    preConfirm: (layerId, layer) => {
      // Remove any existing empty-annotation comments on this layer (not pure highlights)
      for (const h of layer.highlights) {
        if (h.type === "comment" && !h.annotation.trim()) {
          removeHighlightRef.current(layerId, h.id);
        }
      }
    },
  };
}

export interface UseCommentModeOptions {
  isLocked: boolean;
  activeTool: ActiveTool;
  selection: WordSelection | null;
  activeLayerId: string | null;
  addLayer: () => string;
  layers: {
    id: string;
    highlights: {
      id: string;
      editorIndex: number;
      from: number;
      to: number;
      text: string;
      annotation: string;
      type: "highlight" | "comment";
    }[];
  }[];
  addHighlight: (
    layerId: string,
    highlight: {
      editorIndex: number;
      from: number;
      to: number;
      text: string;
      annotation: string;
      type: "highlight" | "comment";
    },
  ) => string;
  removeHighlight: (layerId: string, highlightId: string) => void;
  onHighlightAdded?: (layerId: string, highlightId: string) => void;
  setStatus: (msg: StatusMessage) => void;
  flashStatus: (msg: StatusMessage, duration: number) => void;
  clearStatus: () => void;
}

export function useCommentMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addLayer,
  layers,
  addHighlight,
  removeHighlight,
  onHighlightAdded,
  setStatus,
  flashStatus,
  clearStatus,
}: UseCommentModeOptions) {
  const removeHighlightRef = useLatestRef(removeHighlight);
  const config = createCommentConfig(removeHighlightRef);

  const { confirm } = useAnnotationToolMode({
    config,
    isLocked,
    activeTool,
    selection,
    activeLayerId,
    addLayer,
    layers,
    addItem: addHighlight as never,
    removeItem: removeHighlight,
    setStatus,
    flashStatus,
    clearStatus,
    addedText: i18n.t("tools:comments.added"),
    onItemAdded: onHighlightAdded,
  });

  return { confirmComment: confirm };
}
