// Arrow visual style definitions and SVG path computation for annotation arrows.
// Supports solid, dashed, dotted, and double-line styles.
import type { ArrowStyle } from "@/types/editor"

export const ARROW_STYLES: { value: ArrowStyle; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "double", label: "Double" },
]

export interface ArrowStyleAttrs {
  strokeDasharray: string | null
  strokeWidth: number
  isDouble: boolean
}

export function getArrowStyleAttrs(style: ArrowStyle = "solid"): ArrowStyleAttrs {
  switch (style) {
    case "dashed":
      return { strokeDasharray: "8 4", strokeWidth: 2, isDouble: false }
    case "dotted":
      return { strokeDasharray: "2 4", strokeWidth: 2, isDouble: false }
    case "double":
      return { strokeDasharray: null, strokeWidth: 1, isDouble: true }
    case "solid":
    default:
      return { strokeDasharray: null, strokeWidth: 2, isDouble: false }
  }
}

/**
 * Compute two parallel offset paths for double-line style arrows.
 * Given a 3-point path (start → midpoint → end), offsets each segment
 * perpendicularly by ±offset pixels.
 */
export function computeDoubleLinePaths(
  x1: number,
  y1: number,
  mx: number,
  my: number,
  x2: number,
  y2: number,
  offset: number = 1.5
): [string, string] {
  // First segment: (x1,y1) → (mx,my)
  const dx1 = mx - x1
  const dy1 = my - y1
  const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
  const nx1 = len1 > 0 ? -dy1 / len1 : 0
  const ny1 = len1 > 0 ? dx1 / len1 : 0

  // Second segment: (mx,my) → (x2,y2)
  const dx2 = x2 - mx
  const dy2 = y2 - my
  const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
  const nx2 = len2 > 0 ? -dy2 / len2 : 0
  const ny2 = len2 > 0 ? dx2 / len2 : 0

  // Average normal at midpoint
  const nxm = (nx1 + nx2) / 2
  const nym = (ny1 + ny2) / 2
  const lenm = Math.sqrt(nxm * nxm + nym * nym)
  const nxmN = lenm > 0 ? nxm / lenm : 0
  const nymN = lenm > 0 ? nym / lenm : 0

  const pathA =
    `M ${x1 + nx1 * offset} ${y1 + ny1 * offset} ` +
    `L ${mx + nxmN * offset} ${my + nymN * offset} ` +
    `L ${x2 + nx2 * offset} ${y2 + ny2 * offset}`

  const pathB =
    `M ${x1 - nx1 * offset} ${y1 - ny1 * offset} ` +
    `L ${mx - nxmN * offset} ${my - nymN * offset} ` +
    `L ${x2 - nx2 * offset} ${y2 - ny2 * offset}`

  return [pathA, pathB]
}
