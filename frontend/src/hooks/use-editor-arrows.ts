// Syncs arrow annotation data from layers into the ProseMirror arrow-lines
// plugin for a single editor. Updates the plugin whenever layers, dark mode,
// visibility, or the selected arrow changes.
import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { Layer } from "@/types/editor";
import { getArrowLinesView, type ArrowData } from "@/lib/tiptap/extensions/arrow-lines-plugin";

export function useEditorArrows(
  editor: Editor | null,
  layers: Layer[],
  editorIndex: number,
  isLocked: boolean,
  isDarkMode: boolean,
  sectionVisibility: boolean[],
  removeArrow: (layerId: string, arrowId: string) => void,
  selectedArrowId: string | null,
) {
  // Update dark mode
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const view = getArrowLinesView(editor.view);
    view?.setDarkMode(isDarkMode);
  }, [editor, isDarkMode]);

  // Update arrows when layers or visibility change
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const view = getArrowLinesView(editor.view);
    if (!view) return;

    if (!isLocked) {
      view.setArrows([]);
      return;
    }

    const arrowData: ArrowData[] = [];

    for (const layer of layers) {
      if (!layer.visible) continue;
      for (const arrow of layer.arrows) {
        // Only within-editor arrows (both endpoints in this editor)
        if (arrow.from.editorIndex !== editorIndex) continue;
        if (arrow.to.editorIndex !== editorIndex) continue;
        if (sectionVisibility[editorIndex] === false) continue;
        arrowData.push({
          layerId: layer.id,
          arrowId: arrow.id,
          color: layer.color,
          arrowStyle: arrow.arrowStyle ?? "solid",
          from: arrow.from,
          to: arrow.to,
        });
      }
    }

    view.setArrows(arrowData);
  }, [editor, layers, editorIndex, sectionVisibility, isLocked]);

  // Update selected arrow in plugin
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const view = getArrowLinesView(editor.view);
    view?.setSelectedArrowId(selectedArrowId);
  }, [editor, selectedArrowId]);

  // removeArrow is used by ArrowOverlay interaction layer, not the plugin
  void removeArrow;
}
