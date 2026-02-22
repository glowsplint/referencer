// Shows a subtle underline on the word under the mouse cursor in locked
// mode. Uses underline instead of background to avoid conflicting with
// existing layer highlights. Skips words that are already selected or
// already have a visible layer highlight to avoid visual clutter.
import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { Layer, WordSelection } from "@/types/editor";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { wordHoverPluginKey } from "@/lib/tiptap/extensions/word-hover";
import { getWordBoundaries } from "@/lib/tiptap/word-boundaries";
import { parseHexToRgba } from "@/lib/color";
import { DEFAULT_LAYER_COLOR } from "@/constants/colors";

export function useWordHover(
  editor: Editor | null,
  editorIndex: number,
  isLocked: boolean,
  isDarkMode: boolean,
  selection: WordSelection | null,
  activeLayerColor: string | null,
  layers: Layer[],
) {
  const lastWordRef = useRef<{ from: number; to: number } | null>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed || !isLocked) {
      lastWordRef.current = null;
      return;
    }

    const dom = editor.view?.dom;
    if (!dom) return;

    const clearHover = () => {
      if (lastWordRef.current) {
        lastWordRef.current = null;
        const tr = editor.state.tr.setMeta(wordHoverPluginKey, DecorationSet.empty);
        editor.view.dispatch(tr);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const coords = { left: e.clientX, top: e.clientY };
      const posInfo = editor.view.posAtCoords(coords);
      if (!posInfo) {
        clearHover();
        return;
      }

      const word = getWordBoundaries(editor.state.doc, posInfo.pos);
      if (!word) {
        clearHover();
        return;
      }

      // Skip if same word as last hover
      if (
        lastWordRef.current &&
        lastWordRef.current.from === word.from &&
        lastWordRef.current.to === word.to
      ) {
        return;
      }

      // Skip if hovered word matches current selection
      if (
        selection &&
        selection.editorIndex === editorIndex &&
        selection.from === word.from &&
        selection.to === word.to
      ) {
        clearHover();
        return;
      }

      // Skip if hovered word overlaps a visible layer highlight
      const overlapsLayerHighlight = layers.some(
        (layer) =>
          layer.visible &&
          layer.highlights.some(
            (h) => h.editorIndex === editorIndex && h.from < word.to && h.to > word.from,
          ),
      );
      if (overlapsLayerHighlight) {
        clearHover();
        return;
      }

      lastWordRef.current = { from: word.from, to: word.to };
      // Underline (not background) to avoid obscuring existing layer highlights
      const underlineColor = parseHexToRgba(activeLayerColor ?? DEFAULT_LAYER_COLOR, 0.4);
      try {
        const decoration = Decoration.inline(word.from, word.to, {
          style: `text-decoration: underline; text-decoration-color: ${underlineColor}; text-decoration-thickness: 1.5px; text-underline-offset: 2px`,
          class: "word-hover",
        });
        const decorationSet = DecorationSet.create(editor.state.doc, [decoration]);
        const tr = editor.state.tr.setMeta(wordHoverPluginKey, decorationSet);
        editor.view.dispatch(tr);
      } catch {
        lastWordRef.current = null;
      }
    };

    const onMouseLeave = () => {
      clearHover();
    };

    dom.addEventListener("mousemove", onMouseMove);
    dom.addEventListener("mouseleave", onMouseLeave);
    return () => {
      dom.removeEventListener("mousemove", onMouseMove);
      dom.removeEventListener("mouseleave", onMouseLeave);
      // Clear decoration on cleanup
      if (!editor.isDestroyed) {
        const tr = editor.state.tr.setMeta(wordHoverPluginKey, DecorationSet.empty);
        editor.view.dispatch(tr);
      }
      lastWordRef.current = null;
    };
  }, [editor, editorIndex, isLocked, isDarkMode, selection, activeLayerColor, layers]);
}
