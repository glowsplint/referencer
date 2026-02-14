import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"
import type { CollectedWord } from "@/lib/tiptap/word-collection"
import type { WordCenter } from "@/lib/tiptap/nearest-word"
import { collectAllWords } from "@/lib/tiptap/word-collection"
import {
  getWordCenter,
  findNearestWord,
  findNearestWordOnSameLine,
  findFirstWordOnAdjacentLine,
  findWordInReadingOrder,
} from "@/lib/tiptap/nearest-word"

export interface NavigationResult {
  target: CollectedWord | null
  /** Updated sticky X value (`null` means "clear it", a number means "set it") */
  stickyX: number | null
}

export interface NavigationContext {
  editorsRef: React.RefObject<Map<number, Editor>>
  containerRect: DOMRect
  editorCount: number
}

/**
 * Collect all word candidates with their visual centers across all editors.
 */
export function collectCandidates(ctx: NavigationContext): WordCenter[] {
  const candidates: WordCenter[] = []
  for (let i = 0; i < ctx.editorCount; i++) {
    const editor = ctx.editorsRef.current.get(i)
    if (!editor) continue
    for (const word of collectAllWords(editor, i)) {
      const center = getWordCenter(word, ctx.editorsRef, ctx.containerRect)
      if (center) candidates.push({ word, ...center })
    }
  }
  return candidates
}

/**
 * Find the navigation target for a horizontal arrow key (Left/Right).
 *
 * Tries same-line first, then wraps to the adjacent line.
 * Always clears the sticky X (returns `stickyX: null`).
 */
export function findHorizontalTarget(
  key: "ArrowLeft" | "ArrowRight",
  currentCenter: { cx: number; cy: number },
  allCandidates: WordCenter[]
): NavigationResult {
  const sameLine = findNearestWordOnSameLine(currentCenter, allCandidates, key)
  if (sameLine) return { target: sameLine, stickyX: null }

  const wrapped = findFirstWordOnAdjacentLine(currentCenter, allCandidates, key)
  return { target: wrapped, stickyX: null }
}

/**
 * Find the navigation target for a vertical arrow key (Up/Down).
 *
 * Uses the sticky X for horizontal alignment (initializes it from
 * `currentCenter.cx` when `null`). Prefers candidates in the same editor,
 * falls back to cross-editor spatial search, then reading order.
 */
export function findVerticalTarget(
  key: "ArrowUp" | "ArrowDown",
  currentCenter: { cx: number; cy: number },
  allCandidates: WordCenter[],
  currentWord: WordSelection,
  stickyX: number | null
): NavigationResult {
  const effectiveStickyX = stickyX ?? currentCenter.cx
  const navCenter = { cx: effectiveStickyX, cy: currentCenter.cy }

  // 1. Try same-editor candidates first
  const sameEditorCandidates = allCandidates.filter(
    (c) => c.word.editorIndex === currentWord.editorIndex
  )
  const sameEditorNearest = findNearestWord(navCenter, sameEditorCandidates, key)
  if (sameEditorNearest) {
    return { target: sameEditorNearest, stickyX: effectiveStickyX }
  }

  // 2. Try all candidates (cross-editor spatial)
  const nearest = findNearestWord(navCenter, allCandidates, key)
  if (nearest) {
    return { target: nearest, stickyX: effectiveStickyX }
  }

  // 3. Fall back to reading order to cross editor boundaries
  const fallbackDirection =
    key === "ArrowDown" ? ("ArrowRight" as const) : ("ArrowLeft" as const)
  const allWords = allCandidates.map((c) => c.word)
  const fallback = findWordInReadingOrder(currentWord, allWords, fallbackDirection)
  return { target: fallback, stickyX: effectiveStickyX }
}

/**
 * Resolve a navigation target for the given arrow key, current center, candidates,
 * current word, and sticky X state.
 *
 * Returns the target word (if any) and the updated sticky X value.
 */
export function resolveNavigationTarget(
  key: string,
  currentCenter: { cx: number; cy: number },
  allCandidates: WordCenter[],
  currentWord: WordSelection,
  stickyX: number | null
): NavigationResult {
  if (key === "ArrowLeft" || key === "ArrowRight") {
    return findHorizontalTarget(key, currentCenter, allCandidates)
  }
  return findVerticalTarget(
    key as "ArrowUp" | "ArrowDown",
    currentCenter,
    allCandidates,
    currentWord,
    stickyX
  )
}

/**
 * Return the word with the smallest `from` in the given passage (editorIndex).
 */
export function findFirstWordInPassage(
  editorIndex: number,
  allCandidates: WordCenter[]
): CollectedWord | null {
  const inPassage = allCandidates.filter(
    (c) => c.word.editorIndex === editorIndex
  )
  if (inPassage.length === 0) return null
  return inPassage.reduce((best, c) =>
    c.word.from < best.word.from ? c : best
  ).word
}

/**
 * Return the word with the largest `to` in the given passage (editorIndex).
 */
export function findLastWordInPassage(
  editorIndex: number,
  allCandidates: WordCenter[]
): CollectedWord | null {
  const inPassage = allCandidates.filter(
    (c) => c.word.editorIndex === editorIndex
  )
  if (inPassage.length === 0) return null
  return inPassage.reduce((best, c) =>
    c.word.to > best.word.to ? c : best
  ).word
}

/**
 * Like `findHorizontalTarget` but constrained to the same passage (editorIndex).
 */
export function findHorizontalTargetConstrained(
  key: "ArrowLeft" | "ArrowRight",
  currentCenter: { cx: number; cy: number },
  allCandidates: WordCenter[],
  currentWord: WordSelection
): NavigationResult {
  const sameEditor = allCandidates.filter(
    (c) => c.word.editorIndex === currentWord.editorIndex
  )
  const sameLine = findNearestWordOnSameLine(currentCenter, sameEditor, key)
  if (sameLine) return { target: sameLine, stickyX: null }

  const wrapped = findFirstWordOnAdjacentLine(currentCenter, sameEditor, key)
  return { target: wrapped, stickyX: null }
}

/**
 * Like `findVerticalTarget` step 1 only — stays within the same passage.
 * No cross-editor fallback.
 */
export function findVerticalTargetConstrained(
  key: "ArrowUp" | "ArrowDown",
  currentCenter: { cx: number; cy: number },
  allCandidates: WordCenter[],
  currentWord: WordSelection,
  stickyX: number | null
): NavigationResult {
  const effectiveStickyX = stickyX ?? currentCenter.cx
  const navCenter = { cx: effectiveStickyX, cy: currentCenter.cy }

  const sameEditorCandidates = allCandidates.filter(
    (c) => c.word.editorIndex === currentWord.editorIndex
  )
  const nearest = findNearestWord(navCenter, sameEditorCandidates, key)
  return { target: nearest, stickyX: effectiveStickyX }
}

/**
 * Compute a WordSelection spanning the entire passage (first to last word).
 */
export function computeSelectAllInPassage(
  editorIndex: number,
  allCandidates: WordCenter[],
  editor: Editor
): WordSelection | null {
  const first = findFirstWordInPassage(editorIndex, allCandidates)
  const last = findLastWordInPassage(editorIndex, allCandidates)
  if (!first || !last) return null

  const from = first.from
  const to = last.to
  const text = editor.state.doc.textBetween(from, to, " ")
  return { editorIndex, from, to, text }
}

/**
 * Compute the merged range selection after a shift+arrow navigation.
 *
 * Returns the new `WordSelection` spanning from anchor to the new head,
 * or `null` if the target crosses editor boundaries.
 */
export function computeRangeSelection(
  anchor: WordSelection,
  target: CollectedWord,
  editor: Editor
): WordSelection | null {
  if (target.editorIndex !== anchor.editorIndex) return null

  const from = Math.min(anchor.from, target.from)
  const to = Math.max(anchor.to, target.to)
  const text = editor.state.doc.textBetween(from, to, " ")

  return { editorIndex: anchor.editorIndex, from, to, text }
}
