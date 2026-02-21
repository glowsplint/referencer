// Highlights all occurrences of the currently selected text across the editor,
// excluding the primary selection itself. Uses a subtler opacity than the
// main selection highlight to provide visual context without distraction.
import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { WordSelection } from "@/types/editor";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { similarTextPluginKey } from "@/lib/tiptap/extensions/similar-text-highlights";
import { blendWithBackground } from "@/lib/color";
import { DEFAULT_LAYER_COLOR } from "@/constants/colors";
import { findTextMatches } from "@/lib/tiptap/find-text-matches";

/**
 * Highlights all exact matches of the current selection text across
 * this editor's document, using a subtler decoration than the primary selection.
 */
export function useSimilarTextHighlight(
  editor: Editor | null,
  selection: WordSelection | null,
  editorIndex: number,
  isLocked: boolean,
  activeLayerColor: string | null,
  isDarkMode: boolean,
) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    if (!isLocked || !selection) {
      const tr = editor.state.tr.setMeta(similarTextPluginKey, DecorationSet.empty);
      editor.view.dispatch(tr);
      return;
    }

    const matches = findTextMatches(editor.state.doc, selection.text);

    // Filter out the match that overlaps the primary selection (same editor only)
    const filtered = matches.filter((m) => {
      if (selection.editorIndex !== editorIndex) return true;
      return m.from !== selection.from || m.to !== selection.to;
    });

    if (filtered.length === 0) {
      const tr = editor.state.tr.setMeta(similarTextPluginKey, DecorationSet.empty);
      editor.view.dispatch(tr);
      return;
    }

    const color = activeLayerColor
      ? blendWithBackground(activeLayerColor, 0.15, isDarkMode)
      : blendWithBackground(DEFAULT_LAYER_COLOR, 0.15, isDarkMode);

    try {
      const decorations = filtered.map((m) =>
        Decoration.inline(m.from, m.to, {
          style: `background-color: ${color}`,
          class: "similar-text-highlight",
        }),
      );
      const decorationSet = DecorationSet.create(editor.state.doc, decorations);
      const tr = editor.state.tr.setMeta(similarTextPluginKey, decorationSet);
      editor.view.dispatch(tr);
    } catch {
      const tr = editor.state.tr.setMeta(similarTextPluginKey, DecorationSet.empty);
      editor.view.dispatch(tr);
    }
  }, [editor, selection, editorIndex, isLocked, activeLayerColor, isDarkMode]);
}
