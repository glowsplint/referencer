// Handles the "highlight" annotation tool mode. Shows status prompts on entry,
// and on Enter creates a highlight at the current word selection (or toggles
// it off if an identical range already exists with no annotation).
import i18n from "@/i18n";
import type { ActiveTool, WordSelection } from "@/types/editor";
import type { StatusMessage } from "@/hooks/ui/use-status-message";
import {
  useAnnotationToolMode,
  type AnnotationToolConfig,
  type AnnotationItem,
} from "@/hooks/tools/use-annotation-tool-mode";

interface HighlightItem extends AnnotationItem {
  annotation: string;
  type: "highlight" | "comment";
}

interface HighlightLayer {
  id: string;
  highlights: HighlightItem[];
}

const highlightConfig: AnnotationToolConfig<HighlightLayer> = {
  toolName: "highlight",
  i18nKey: "highlight",
  getItems: (layer) => layer.highlights,
  findExisting: (items, sel) =>
    (items as HighlightItem[]).find(
      (h) =>
        h.editorIndex === sel.editorIndex &&
        !h.annotation.trim() &&
        ((h.from === sel.from && h.to === sel.to) || h.text === sel.text),
    ),
  buildPayload: (sel: WordSelection) => ({
    editorIndex: sel.editorIndex,
    from: sel.from,
    to: sel.to,
    text: sel.text,
    annotation: "",
    type: "highlight" as const,
  }),
};

export interface UseHighlightModeOptions {
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
  showHighlightToasts: boolean;
  setStatus: (msg: StatusMessage) => void;
  flashStatus: (msg: StatusMessage, duration: number) => void;
  clearStatus: () => void;
}

export function useHighlightMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addLayer,
  layers,
  addHighlight,
  removeHighlight,
  showHighlightToasts,
  setStatus,
  flashStatus,
  clearStatus,
}: UseHighlightModeOptions) {
  const { confirm } = useAnnotationToolMode({
    config: highlightConfig,
    isLocked,
    activeTool,
    selection,
    activeLayerId,
    addLayer,
    layers,
    addItem: addHighlight as never,
    removeItem: removeHighlight,
    showToasts: showHighlightToasts,
    setStatus,
    flashStatus,
    clearStatus,
    addedText: i18n.t("tools:highlight.added"),
    removedText: i18n.t("tools:highlight.removed"),
  });

  return { confirmHighlight: confirm };
}
