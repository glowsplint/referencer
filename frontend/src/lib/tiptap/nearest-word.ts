import type { Editor } from "@tiptap/react"
import type { CollectedWord } from "./word-collection"

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

export const LINE_TOLERANCE = 12

export function findFirstWordOnAdjacentLine(
  currentCenter: { cx: number; cy: number },
  candidates: WordCenter[],
  direction: "ArrowRight" | "ArrowLeft"
): CollectedWord | null {
  if (direction === "ArrowRight") {
    // Find the next visual row below, then pick its leftmost word
    const below = candidates.filter(
      (c) => c.cy > currentCenter.cy + LINE_TOLERANCE
    )
    if (below.length === 0) return null

    const nextRowY = Math.min(...below.map((c) => c.cy))
    const nextRow = below.filter(
      (c) => Math.abs(c.cy - nextRowY) <= LINE_TOLERANCE
    )
    let leftmost = nextRow[0]
    for (const c of nextRow) {
      if (c.cx < leftmost.cx) leftmost = c
    }
    return leftmost.word
  } else {
    // Find the previous visual row above, then pick its rightmost word
    const above = candidates.filter(
      (c) => c.cy < currentCenter.cy - LINE_TOLERANCE
    )
    if (above.length === 0) return null

    const prevRowY = Math.max(...above.map((c) => c.cy))
    const prevRow = above.filter(
      (c) => Math.abs(c.cy - prevRowY) <= LINE_TOLERANCE
    )
    let rightmost = prevRow[0]
    for (const c of prevRow) {
      if (c.cx > rightmost.cx) rightmost = c
    }
    return rightmost.word
  }
}

export function findNearestWordOnSameLine(
  currentCenter: { cx: number; cy: number },
  candidates: WordCenter[],
  direction: "ArrowLeft" | "ArrowRight"
): CollectedWord | null {
  const threshold = 1

  const sameLine = candidates.filter((c) => {
    if (Math.abs(c.cy - currentCenter.cy) > LINE_TOLERANCE) return false
    if (direction === "ArrowRight") return c.cx > currentCenter.cx + threshold
    return c.cx < currentCenter.cx - threshold
  })

  if (sameLine.length === 0) return null

  let best = sameLine[0]
  let bestDist = Infinity

  for (const c of sameLine) {
    const dist = Math.abs(c.cx - currentCenter.cx)
    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }

  return best.word
}

export interface WordCenter {
  word: CollectedWord
  cx: number
  cy: number
}

export function getWordCenter(
  word: CollectedWord,
  editorsRef: React.RefObject<Map<number, Editor>>,
  containerRect: DOMRect
): { cx: number; cy: number } | null {
  const editor = editorsRef.current.get(word.editorIndex)
  if (!editor) return null

  try {
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
  const threshold = 1

  const filtered = candidates.filter((c) => {
    switch (direction) {
      case "ArrowLeft":
        return c.cx < currentCenter.cx - threshold
      case "ArrowRight":
        return c.cx > currentCenter.cx + threshold
      case "ArrowUp":
        return c.cy < currentCenter.cy - threshold
      case "ArrowDown":
        return c.cy > currentCenter.cy + threshold
    }
  })

  if (filtered.length === 0) return null

  let best = filtered[0]
  let bestScore = Infinity

  for (const c of filtered) {
    let primary: number
    let perpendicular: number

    switch (direction) {
      case "ArrowLeft":
      case "ArrowRight":
        primary = Math.abs(c.cx - currentCenter.cx)
        perpendicular = Math.abs(c.cy - currentCenter.cy)
        break
      case "ArrowUp":
      case "ArrowDown":
        primary = Math.abs(c.cy - currentCenter.cy)
        perpendicular = Math.abs(c.cx - currentCenter.cx)
        break
    }

    const score = primary + 2 * perpendicular
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }

  return best.word
}
