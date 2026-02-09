import type { Editor } from "@tiptap/react"
import type { CollectedWord } from "./word-collection"

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
