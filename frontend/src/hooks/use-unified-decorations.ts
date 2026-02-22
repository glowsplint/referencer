// Builds and applies blended highlight decorations for all visible layers.
// When multiple highlights overlap, their colors are alpha-blended together.
// Segments overlapping ranges at breakpoints so each sub-range gets a single
// blended color. Arrow endpoints receive a higher opacity than plain highlights.
import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { Layer } from "@/types/editor";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { layerHighlightsPluginKey } from "@/lib/tiptap/extensions/layer-highlights";
import { blendColors } from "@/lib/color";

const HIGHLIGHT_OPACITY = 0.3;
const ARROW_OPACITY = 0.6;

interface ColoredRange {
  from: number;
  to: number;
  hex: string;
  opacity: number;
  isArrowEndpoint: boolean;
}

function collectRanges(layers: Layer[], editorIndex: number): ColoredRange[] {
  const ranges: ColoredRange[] = [];

  for (const layer of layers) {
    if (!layer.visible) continue;

    for (const highlight of layer.highlights) {
      if (highlight.visible === false) continue;
      if (highlight.editorIndex !== editorIndex) continue;
      ranges.push({
        from: highlight.from,
        to: highlight.to,
        hex: layer.color,
        opacity: HIGHLIGHT_OPACITY,
        isArrowEndpoint: false,
      });
    }

    for (const arrow of layer.arrows) {
      if (arrow.visible === false) continue;
      if (arrow.from.editorIndex === editorIndex) {
        ranges.push({
          from: arrow.from.from,
          to: arrow.from.to,
          hex: layer.color,
          opacity: ARROW_OPACITY,
          isArrowEndpoint: true,
        });
      }
      if (arrow.to.editorIndex === editorIndex) {
        ranges.push({
          from: arrow.to.from,
          to: arrow.to.to,
          hex: layer.color,
          opacity: ARROW_OPACITY,
          isArrowEndpoint: true,
        });
      }
    }
  }

  return ranges;
}

// Splits overlapping ranges into non-overlapping segments at each unique
// boundary point, then blends contributing colors for each segment.
function segmentAndBlend(ranges: ColoredRange[], isDarkMode: boolean): Decoration[] {
  if (ranges.length === 0) return [];

  // Collect all unique breakpoints
  const breakpointSet = new Set<number>();
  for (const r of ranges) {
    breakpointSet.add(r.from);
    breakpointSet.add(r.to);
  }
  const breakpoints = Array.from(breakpointSet).sort((a, b) => a - b);

  const decorations: Decoration[] = [];

  for (let i = 0; i < breakpoints.length - 1; i++) {
    const start = breakpoints[i];
    const end = breakpoints[i + 1];

    // Find all ranges that contain this segment
    const contributors = ranges.filter((r) => r.from <= start && r.to >= end);
    if (contributors.length === 0) continue;

    const hasArrowEndpoint = contributors.some((c) => c.isArrowEndpoint);
    const blended = blendColors(
      contributors.map((c) => ({ hex: c.hex, opacity: c.opacity })),
      isDarkMode,
    );

    try {
      decorations.push(
        Decoration.inline(start, end, {
          style: `background-color: ${blended}`,
          class: hasArrowEndpoint ? "arrow-endpoint" : undefined,
        }),
      );
    } catch {
      // Position may be invalid — skip
    }
  }

  return decorations;
}

export function useUnifiedDecorations(
  editor: Editor | null,
  layers: Layer[],
  editorIndex: number,
  isLocked: boolean,
  isDarkMode: boolean,
) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    if (!isLocked) {
      const tr = editor.state.tr.setMeta(layerHighlightsPluginKey, DecorationSet.empty);
      editor.view.dispatch(tr);
      return;
    }

    const ranges = collectRanges(layers, editorIndex);
    const decorations = segmentAndBlend(ranges, isDarkMode);
    const decorationSet = DecorationSet.create(editor.state.doc, decorations);
    const tr = editor.state.tr.setMeta(layerHighlightsPluginKey, decorationSet);
    editor.view.dispatch(tr);
  }, [editor, layers, editorIndex, isLocked, isDarkMode]);
}
