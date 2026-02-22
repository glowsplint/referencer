// SVG geometry utilities for arrow overlay rendering.
// Computes clamped paths, midpoints, and coordinate transforms
// for cross-editor arrow connectors.
import type { Arrow } from "@/types/editor";
import type { Editor } from "@tiptap/react";
import { getClampedWordCenter } from "@/lib/tiptap/nearest-word";

export interface ClampedPathResult {
  d: string;
  anyClamped: boolean;
  fromCenter: { cx: number; cy: number };
  toCenter: { cx: number; cy: number };
}

/**
 * Compute SVG path for a cross-editor arrow with endpoints clamped to each editor's
 * visible viewport. In rows layout, scrolled-out words would place arrow endpoints
 * in the gap between editors ("phantom" area); clamping pins them to the editor edge.
 */
export function computeClampedPath(
  arrow: Arrow,
  editorsRef: React.RefObject<Map<number, Editor>>,
  containerRect: DOMRect,
): ClampedPathResult | null {
  const from = getClampedWordCenter(arrow.from, editorsRef, containerRect);
  const to = getClampedWordCenter(arrow.to, editorsRef, containerRect);
  if (!from || !to) return null;
  const mx = (from.cx + to.cx) / 2;
  const my = (from.cy + to.cy) / 2;
  return {
    d: `M ${from.cx} ${from.cy} L ${mx} ${my} L ${to.cx} ${to.cy}`,
    anyClamped: from.clamped || to.clamped,
    fromCenter: from,
    toCenter: to,
  };
}

/**
 * Build an SVG path string from two endpoints (start, end) with midpoint.
 */
export function buildArrowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { d: string; mx: number; my: number } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return {
    d: `M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`,
    mx,
    my,
  };
}
