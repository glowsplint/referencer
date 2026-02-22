// Imperative SVG element creation helpers for arrow overlay rendering.
// These build DOM elements directly (not via React) for the per-wrapper
// SVGs that are injected into each editor's scroll container.
import { ARROWHEAD, SVG_NS } from "@/constants/arrow";
import type { ArrowStyleAttrs } from "@/lib/arrow-styles";

/**
 * Create an SVG `<marker>` element with the standard arrowhead polygon.
 */
export function createMarkerElement(id: string, fillColor: string): SVGMarkerElement {
  const marker = document.createElementNS(SVG_NS, "marker");
  marker.setAttribute("id", id);
  marker.setAttribute("markerWidth", String(ARROWHEAD.WIDTH));
  marker.setAttribute("markerHeight", String(ARROWHEAD.HEIGHT));
  marker.setAttribute("refX", String(ARROWHEAD.REF_X));
  marker.setAttribute("refY", String(ARROWHEAD.REF_Y));
  marker.setAttribute("orient", "auto");

  const polygon = document.createElementNS(SVG_NS, "polygon");
  polygon.setAttribute("points", ARROWHEAD.POINTS);
  polygon.setAttribute("fill", fillColor);
  marker.appendChild(polygon);

  return marker;
}

/**
 * Create a single SVG `<path>` element for an arrow line segment.
 */
export function createArrowPath(
  d: string,
  strokeColor: string,
  styleAttrs: ArrowStyleAttrs,
  opts?: {
    testId?: string;
    markerId?: string;
  },
): SVGPathElement {
  const path = document.createElementNS(SVG_NS, "path");
  if (opts?.testId) path.setAttribute("data-testid", opts.testId);
  path.setAttribute("d", d);
  path.setAttribute("stroke", strokeColor);
  path.setAttribute("stroke-width", String(styleAttrs.strokeWidth));
  path.setAttribute("fill", "none");
  if (styleAttrs.strokeDasharray) {
    path.setAttribute("stroke-dasharray", styleAttrs.strokeDasharray);
  }
  if (opts?.markerId) {
    path.setAttribute("marker-mid", `url(#${opts.markerId})`);
  }
  return path;
}

/**
 * Create the invisible marker-only path used for double-line arrowheads.
 * This path carries the marker-mid but has no visible stroke.
 */
export function createMarkerOnlyPath(d: string, markerId: string): SVGPathElement {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  path.setAttribute("stroke", "none");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("fill", "none");
  path.setAttribute("marker-mid", `url(#${markerId})`);
  return path;
}

/**
 * Create a hover ring path for wrapper SVG rendering.
 */
export function createHoverRingPath(
  d: string,
  color: string,
  isEraser: boolean,
): SVGPathElement {
  const ring = document.createElementNS(SVG_NS, "path");
  ring.setAttribute("d", d);
  ring.setAttribute("stroke", isEraser ? "#ef4444" : color);
  ring.setAttribute("stroke-width", "6");
  ring.setAttribute("stroke-opacity", isEraser ? "0.3" : "0.15");
  ring.setAttribute("fill", "none");
  ring.style.pointerEvents = "none";
  return ring;
}

/**
 * Create an SVG `<rect>` element for the preview anchor highlight.
 */
export function createPreviewRect(
  rect: { x: number; y: number; width: number; height: number },
  fillColor: string,
  opacity: number,
): SVGGElement {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("opacity", String(opacity));
  const svgRect = document.createElementNS(SVG_NS, "rect");
  svgRect.setAttribute("data-testid", "wrapper-preview-anchor-rect");
  svgRect.setAttribute("x", String(rect.x));
  svgRect.setAttribute("y", String(rect.y));
  svgRect.setAttribute("width", String(rect.width));
  svgRect.setAttribute("height", String(rect.height));
  svgRect.setAttribute("fill", fillColor);
  g.appendChild(svgRect);
  return g;
}

/**
 * Create the preview arrow path (dashed line with arrowhead marker).
 */
export function createPreviewArrowPath(
  d: string,
  strokeColor: string,
  opacity: number,
  markerId: string,
): SVGGElement {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("opacity", String(opacity));
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("data-testid", "wrapper-preview-arrow");
  path.setAttribute("d", d);
  path.setAttribute("stroke", strokeColor);
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-dasharray", "6 4");
  path.setAttribute("fill", "none");
  path.setAttribute("marker-mid", `url(#${markerId})`);
  g.appendChild(path);
  return g;
}
