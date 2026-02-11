import { useState, useCallback, useEffect, useRef } from "react"
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
import { isEditableElement } from "@/lib/dom"

const ARROW_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"])
const HAS_ALPHANUMERIC = /[a-zA-Z0-9]/

interface UseWordSelectionOptions {
  isLocked: boolean
  editorsRef: React.RefObject<Map<number, Editor>>
  containerRef: React.RefObject<HTMLDivElement | null>
  editorCount: number
}

export function useWordSelection({
  isLocked,
  editorsRef,
  containerRef,
  editorCount,
}: UseWordSelectionOptions) {
  const [selection, setSelection] = useState<WordSelection | null>(null)
  const stickyXRef = useRef<number | null>(null)
  const anchorRef = useRef<WordSelection | null>(null)
  const headRef = useRef<WordSelection | null>(null)

  const selectWord = useCallback(
    (editorIndex: number, from: number, to: number, text: string) => {
      if (!HAS_ALPHANUMERIC.test(text)) return
      anchorRef.current = null
      headRef.current = null
      setSelection({ editorIndex, from, to, text })
    },
    []
  )

  const clearSelection = useCallback(() => {
    anchorRef.current = null
    headRef.current = null
    setSelection(null)
  }, [])

  useEffect(() => {
    if (!isLocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on prop change
      setSelection(null)
    }
  }, [isLocked])

  useEffect(() => {
    if (!isLocked) return

    const collectCandidates = (): WordCenter[] => {
      const container = containerRef.current
      if (!container) return []
      const containerRect = container.getBoundingClientRect()

      const candidates: WordCenter[] = []
      for (let i = 0; i < editorCount; i++) {
        const editor = editorsRef.current.get(i)
        if (!editor) continue
        for (const word of collectAllWords(editor, i)) {
          const center = getWordCenter(word, editorsRef, containerRect)
          if (center) candidates.push({ word, ...center })
        }
      }
      return candidates
    }

    const findHorizontalTarget = (
      key: "ArrowLeft" | "ArrowRight",
      currentCenter: { cx: number; cy: number },
      allCandidates: WordCenter[]
    ): CollectedWord | null => {
      stickyXRef.current = null
      const sameLine = findNearestWordOnSameLine(currentCenter, allCandidates, key)
      if (sameLine) return sameLine
      return findFirstWordOnAdjacentLine(currentCenter, allCandidates, key)
    }

    const findVerticalTarget = (
      key: "ArrowUp" | "ArrowDown",
      currentCenter: { cx: number; cy: number },
      allCandidates: WordCenter[],
      currentWord: WordSelection
    ): CollectedWord | null => {
      if (stickyXRef.current === null) {
        stickyXRef.current = currentCenter.cx
      }
      const navCenter = { cx: stickyXRef.current, cy: currentCenter.cy }

      // 1. Try same-editor candidates first
      const sameEditorCandidates = allCandidates.filter(
        (c) => c.word.editorIndex === currentWord.editorIndex
      )
      const sameEditorNearest = findNearestWord(navCenter, sameEditorCandidates, key)
      if (sameEditorNearest) return sameEditorNearest

      // 2. Try all candidates (cross-editor spatial)
      const nearest = findNearestWord(navCenter, allCandidates, key)
      if (nearest) return nearest

      // 3. Fall back to reading order to cross editor boundaries
      const fallbackDirection = key === "ArrowDown" ? "ArrowRight" as const : "ArrowLeft" as const
      const allWords = allCandidates.map((c) => c.word)
      return findWordInReadingOrder(currentWord, allWords, fallbackDirection)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!ARROW_KEYS.has(e.key)) return
      if (isEditableElement(document.activeElement)) return
      if (!selection) return

      e.preventDefault()

      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      const allCandidates = collectCandidates()

      if (e.shiftKey) {
        // Initialize anchor/head on first shift+arrow
        if (!anchorRef.current) {
          anchorRef.current = selection
          headRef.current = selection
        }

        const head = headRef.current!
        const currentCenter = getWordCenter(head, editorsRef, containerRect)
        if (!currentCenter) return

        let target: CollectedWord | null
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          target = findHorizontalTarget(e.key, currentCenter, allCandidates)
        } else {
          target = findVerticalTarget(
            e.key as "ArrowUp" | "ArrowDown",
            currentCenter,
            allCandidates,
            head
          )
        }

        if (!target) return
        // Don't extend across editors
        if (target.editorIndex !== anchorRef.current.editorIndex) return

        headRef.current = target
        const anchor = anchorRef.current
        const from = Math.min(anchor.from, target.from)
        const to = Math.max(anchor.to, target.to)

        const editor = editorsRef.current.get(anchor.editorIndex)
        if (!editor) return
        const text = editor.state.doc.textBetween(from, to, " ")

        setSelection({ editorIndex: anchor.editorIndex, from, to, text })
      } else {
        // Normal navigation (no shift)
        anchorRef.current = null
        headRef.current = null

        const currentCenter = getWordCenter(selection, editorsRef, containerRect)
        if (!currentCenter) return

        let target: CollectedWord | null
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          target = findHorizontalTarget(e.key, currentCenter, allCandidates)
        } else {
          target = findVerticalTarget(
            e.key as "ArrowUp" | "ArrowDown",
            currentCenter,
            allCandidates,
            selection
          )
        }

        if (target) setSelection(target)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isLocked, selection, editorsRef, containerRef, editorCount])

  return { selection, selectWord, clearSelection }
}
