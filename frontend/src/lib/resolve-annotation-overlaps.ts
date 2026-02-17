// Resolves vertical positioning of annotation cards in the side panel
// so they don't overlap. Uses a greedy top-down algorithm that pushes
// each card down just enough to avoid colliding with the one above it.

export interface AnnotationPosition {
  id: string
  desiredTop: number
}

export interface ResolvedPosition {
  id: string
  top: number
}

const CARD_HEIGHT = 72
const CARD_GAP = 8

/**
 * Greedy top-down algorithm: sort by desired top, then push each card down
 * if it would overlap the previous one.
 */
export function resolveAnnotationOverlaps(
  positions: AnnotationPosition[]
): ResolvedPosition[] {
  if (positions.length === 0) return []

  const sorted = [...positions].sort((a, b) => a.desiredTop - b.desiredTop)
  const resolved: ResolvedPosition[] = []

  for (const pos of sorted) {
    const prev = resolved[resolved.length - 1]
    const minTop = prev ? prev.top + CARD_HEIGHT + CARD_GAP : -Infinity
    resolved.push({
      id: pos.id,
      top: Math.max(pos.desiredTop, minTop),
    })
  }

  return resolved
}
