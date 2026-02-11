import type { Editor } from "@tiptap/react"
import type { CollectedWord } from "./word-collection"

/** Pixels of vertical distance to group words into the same visual line */
export const LINE_TOLERANCE = 12

/** Minimum pixel distance before considering a candidate (avoids re-selecting current word) */
const SAME_POSITION_THRESHOLD = 1

/** Perpendicular distance is weighted more heavily to prefer horizontally aligned words */
const PERPENDICULAR_WEIGHT = 2

export interface WordCenter {
  word: CollectedWord
  cx: number
  cy: number
}

function closestByCx(candidates: WordCenter[], targetCx: number): WordCenter {
  let best = candidates[0]
  let bestDist = Infinity
  for (const c of candidates) {
    const dist = Math.abs(c.cx - targetCx)
    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }
  return best
}

function findWordsOnNearestLine(
  candidates: WordCenter[],
  direction: "up" | "down"
): WordCenter[] {
  if (candidates.length === 0) return []
  const targetY =
    direction === "down"
      ? Math.min(...candidates.map((c) => c.cy))
      : Math.max(...candidates.map((c) => c.cy))
  return candidates.filter((c) => Math.abs(c.cy - targetY) <= LINE_TOLERANCE)
}

export function findWordInReadingOrder(
  current: CollectedWord,
  allWords: CollectedWord[],
  direction: "ArrowLeft" | "ArrowRight"
): CollectedWord | null {
  const sorted = [...allWords].sort((a, b) => {
    if (a.editorIndex !== b.editorIndex) return a.editorIndex - b.editorIndex
    return a.from - b.from
  })

  const currentIndex = sorted.findIndex(
    (w) =>
      w.editorIndex === current.editorIndex &&
      w.from === current.from &&
      w.to === current.to
  )

  if (currentIndex === -1) return null

  if (direction === "ArrowRight") {
    return currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null
  } else {
    return currentIndex > 0 ? sorted[currentIndex - 1] : null
  }
}

export function findFirstWordOnAdjacentLine(
  currentCenter: { cx: number; cy: number },
  candidates: WordCenter[],
  direction: "ArrowRight" | "ArrowLeft"
): CollectedWord | null {
  const isForward = direction === "ArrowRight"
  const beyondLine = candidates.filter((c) =>
    isForward
      ? c.cy > currentCenter.cy + LINE_TOLERANCE
      : c.cy < currentCenter.cy - LINE_TOLERANCE
  )
  if (beyondLine.length === 0) return null

  const adjacentRow = findWordsOnNearestLine(beyondLine, isForward ? "down" : "up")

  // Pick leftmost for forward (next row), rightmost for backward (previous row)
  const edge = adjacentRow.reduce((best, c) =>
    isForward ? (c.cx < best.cx ? c : best) : (c.cx > best.cx ? c : best)
  )
  return edge.word
}

export function findNearestWordOnSameLine(
  currentCenter: { cx: number; cy: number },
  candidates: WordCenter[],
  direction: "ArrowLeft" | "ArrowRight"
): CollectedWord | null {
  const sameLine = candidates.filter((c) => {
    if (Math.abs(c.cy - currentCenter.cy) > LINE_TOLERANCE) return false
    if (direction === "ArrowRight") return c.cx > currentCenter.cx + SAME_POSITION_THRESHOLD
    return c.cx < currentCenter.cx - SAME_POSITION_THRESHOLD
  })

  if (sameLine.length === 0) return null
  return closestByCx(sameLine, currentCenter.cx).word
}

export function getWordRect(
  word: CollectedWord,
  editorsRef: React.RefObject<Map<number, Editor>>,
  containerRect: DOMRect
): { x: number; y: number; width: number; height: number } | null {
  const editor = editorsRef.current.get(word.editorIndex)
  if (!editor) return null

  try {
    const nodeAt = editor.state.doc.nodeAt(word.from)
    if (nodeAt?.type.name === "image") {
      const dom = editor.view.nodeDOM(word.from)
      if (dom instanceof HTMLElement) {
        const rect = dom.getBoundingClientRect()
        return {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        }
      }
      return null
    }

    const startCoords = editor.view.coordsAtPos(word.from)
    const endCoords = editor.view.coordsAtPos(word.to)
    return {
      x: startCoords.left - containerRect.left,
      y: startCoords.top - containerRect.top,
      width: endCoords.right - startCoords.left,
      height: startCoords.bottom - startCoords.top,
    }
  } catch {
    return null
  }
}

export function getWordCenter(
  word: CollectedWord,
  editorsRef: React.RefObject<Map<number, Editor>>,
  containerRect: DOMRect
): { cx: number; cy: number } | null {
  const editor = editorsRef.current.get(word.editorIndex)
  if (!editor) return null

  try {
    const nodeAt = editor.state.doc.nodeAt(word.from)
    if (nodeAt?.type.name === "image") {
      const dom = editor.view.nodeDOM(word.from)
      if (dom instanceof HTMLElement) {
        const rect = dom.getBoundingClientRect()
        return {
          cx: (rect.left + rect.right) / 2 - containerRect.left,
          cy: (rect.top + rect.bottom) / 2 - containerRect.top,
        }
      }
      return null
    }

    const startCoords = editor.view.coordsAtPos(word.from)
    const endCoords = editor.view.coordsAtPos(word.to)
    return {
      cx: (startCoords.left + endCoords.right) / 2 - containerRect.left,
      cy: (startCoords.top + startCoords.bottom) / 2 - containerRect.top,
    }
  } catch {
    return null
  }
}

export function findNearestWord(
  currentCenter: { cx: number; cy: number },
  candidates: WordCenter[],
  direction: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"
): CollectedWord | null {
  const filtered = candidates.filter((c) => {
    switch (direction) {
      case "ArrowLeft":
        return c.cx < currentCenter.cx - SAME_POSITION_THRESHOLD
      case "ArrowRight":
        return c.cx > currentCenter.cx + SAME_POSITION_THRESHOLD
      case "ArrowUp":
        return c.cy < currentCenter.cy - SAME_POSITION_THRESHOLD
      case "ArrowDown":
        return c.cy > currentCenter.cy + SAME_POSITION_THRESHOLD
    }
  })

  if (filtered.length === 0) return null

  if (direction === "ArrowUp" || direction === "ArrowDown") {
    const lineDir = direction === "ArrowDown" ? "down" as const : "up" as const
    const lineWords = findWordsOnNearestLine(filtered, lineDir)
    return closestByCx(lineWords, currentCenter.cx).word
  }

  // Left/Right: use weighted scoring favoring horizontal alignment
  let best = filtered[0]
  let bestScore = Infinity

  for (const c of filtered) {
    const primary = Math.abs(c.cx - currentCenter.cx)
    const perpendicular = Math.abs(c.cy - currentCenter.cy)
    const score = primary + PERPENDICULAR_WEIGHT * perpendicular
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }

  return best.word
}
