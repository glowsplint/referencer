/** SVG arrowhead marker geometry — used by ArrowOverlay and arrow-lines-plugin. */
export const ARROWHEAD = {
  WIDTH: 8,
  HEIGHT: 6,
  REF_X: 4,
  REF_Y: 3,
  POINTS: "0 0, 8 3, 0 6",
} as const;

/** Default opacity for fully visible arrows. */
export const ARROW_OPACITY = 0.6;

/** Reduced opacity for arrows with off-screen (clamped) endpoints. */
export const ARROW_OPACITY_OFFSCREEN = 0.15;

/** SVG namespace URI for imperative element creation. */
export const SVG_NS = "http://www.w3.org/2000/svg";
