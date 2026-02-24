// Computes viewport-relative positions for all comment highlights across editors.
// Used to position the comment sidebar markers. Recomputes on scroll, resize,
// and layer changes using DOM Range measurements for accuracy.
import { useEffect, useLayoutEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { Layer } from "@/types/editor";

export interface HighlightPosition {
  highlightId: string;
  layerId: string;
  editorIndex: number;
  top: number;
  rightEdge: number;
  leftEdge: number;
}

export function useAllHighlightPositions(
  editorsRef: React.RefObject<Map<number, Editor>>,
  layers: Layer[],
  containerRef: React.RefObject<HTMLDivElement | null>,
  sectionVisibility?: boolean[],
): HighlightPosition[] {
  const [positions, setPositions] = useState<HighlightPosition[]>([]);
  // Track how many editors are mounted so the main effect re-runs when editors appear
  const [editorCount, setEditorCount] = useState(0);

  // Watch for DOM mutations in the container to detect when TipTap editors mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function syncEditorCount() {
      setEditorCount(editorsRef.current.size);
    }

    syncEditorCount();

    const mo = new MutationObserver(() => syncEditorCount());
    mo.observe(container, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, [containerRef, editorsRef]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      setPositions([]);
      return;
    }

    function compute() {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const result: HighlightPosition[] = [];

      for (const layer of layers) {
        if (!layer.visible) continue;
        for (const highlight of layer.highlights.filter((h) => h.type === "comment")) {
          if (sectionVisibility && sectionVisibility[highlight.editorIndex] === false) continue;
          const editor = editorsRef.current.get(highlight.editorIndex);
          if (!editor || editor.isDestroyed) continue;

          try {
            const domStart = editor.view.domAtPos(highlight.from);
            const domEnd = editor.view.domAtPos(highlight.to);
            const range = document.createRange();
            range.setStart(domStart.node, domStart.offset);
            range.setEnd(domEnd.node, domEnd.offset);
            const rects = range.getClientRects();
            if (rects.length === 0) continue;

            // Clip to the editor's scroll wrapper so highlights below the fold
            // don't bleed into other editors' visual territory
            const editorDom = editor.view.dom;
            const wrapper = editorDom.closest(".simple-editor-wrapper");
            const wrapperRect = wrapper?.getBoundingClientRect();

            // Find the first rect visible within the wrapper's bounds
            let visibleRect: DOMRect | null = null;
            let lastVisibleRect: DOMRect | null = null;
            for (const rect of rects) {
              if (wrapperRect && rect.bottom <= wrapperRect.top) continue;
              if (wrapperRect && rect.top >= wrapperRect.bottom) continue;
              if (!visibleRect) visibleRect = rect;
              lastVisibleRect = rect;
            }

            // Skip highlights entirely outside the visible scroll area
            if (!visibleRect) continue;

            const top = visibleRect.top - containerRect.top + container.scrollTop;
            const rightEdge =
              (lastVisibleRect ?? visibleRect).right - containerRect.left + container.scrollLeft;
            const leftEdge = visibleRect.left - containerRect.left + container.scrollLeft;

            result.push({
              highlightId: highlight.id,
              layerId: layer.id,
              editorIndex: highlight.editorIndex,
              top,
              rightEdge,
              leftEdge,
            });
          } catch {
            // Position may be invalid — skip
          }
        }
      }

      setPositions(result);
    }

    compute();

    // Listen to scroll events on each editor's wrapper element
    const scrollHandlers: { el: Element; handler: () => void }[] = [];
    for (const [, editor] of editorsRef.current) {
      if (editor.isDestroyed) continue;
      const editorDom = editor.view.dom;
      const wrapper = editorDom.closest(".simple-editor-wrapper");
      if (wrapper) {
        const handler = () => compute();
        wrapper.addEventListener("scroll", handler, { passive: true });
        scrollHandlers.push({ el: wrapper, handler });
      }
    }

    // Recompute on container resize (e.g. opening dev console, browser resize)
    const ro = new ResizeObserver(() => compute());
    ro.observe(container);

    return () => {
      for (const { el, handler } of scrollHandlers) {
        el.removeEventListener("scroll", handler);
      }
      ro.disconnect();
    };
  }, [editorsRef, layers, containerRef, sectionVisibility, editorCount]);

  return positions;
}
