// Handles the "underline" annotation tool mode. Shows status prompts on entry,
// and on Enter creates an underline at the current word selection (or toggles
// it off if an identical range already exists).
import i18n from "@/i18n";
import type { ActiveTool, WordSelection, LayerUnderline } from "@/types/editor";
import type { StatusMessage } from "@/hooks/ui/use-status-message";
import {
  useAnnotationToolMode,
  type AnnotationToolConfig,
} from "@/hooks/tools/use-annotation-tool-mode";

interface UnderlineLayer {
  id: string;
  underlines: LayerUnderline[];
}

const underlineConfig: AnnotationToolConfig<UnderlineLayer> = {
  toolName: "underline",
  i18nKey: "underline",
  getItems: (layer) => layer.underlines,
  findExisting: (items, sel) =>
    items.find(
      (u) =>
        u.editorIndex === sel.editorIndex &&
        ((u.from === sel.from && u.to === sel.to) || u.text === sel.text),
    ),
  buildPayload: (sel: WordSelection) => ({
    editorIndex: sel.editorIndex,
    from: sel.from,
    to: sel.to,
    text: sel.text,
  }),
};

export interface UseUnderlineModeOptions {
  isLocked: boolean;
  activeTool: ActiveTool;
  selection: WordSelection | null;
  activeLayerId: string | null;
  addLayer: () => string;
  layers: { id: string; underlines: LayerUnderline[] }[];
  addUnderline: (layerId: string, underline: Omit<LayerUnderline, "id" | "visible">) => string;
  removeUnderline: (layerId: string, underlineId: string) => void;
  showUnderlineToasts: boolean;
  setStatus: (msg: StatusMessage) => void;
  flashStatus: (msg: StatusMessage, duration: number) => void;
  clearStatus: () => void;
}

export function useUnderlineMode({
  isLocked,
  activeTool,
  selection,
  activeLayerId,
  addLayer,
  layers,
  addUnderline,
  removeUnderline,
  showUnderlineToasts,
  setStatus,
  flashStatus,
  clearStatus,
}: UseUnderlineModeOptions) {
  const { confirm } = useAnnotationToolMode({
    config: underlineConfig,
    isLocked,
    activeTool,
    selection,
    activeLayerId,
    addLayer,
    layers,
    addItem: addUnderline as never,
    removeItem: removeUnderline,
    showToasts: showUnderlineToasts,
    setStatus,
    flashStatus,
    clearStatus,
    addedText: i18n.t("tools:underline.added"),
  });

  return { confirmUnderline: confirm };
}
