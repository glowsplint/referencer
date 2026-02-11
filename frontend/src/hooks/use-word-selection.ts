import { useState, useCallback, useEffect, useRef } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"
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

  const selectWord = useCallback(
    (editorIndex: number, from: number, to: number, text: string) => {
      if (!HAS_ALPHANUMERIC.test(text)) return
      setSelection({ editorIndex, from, to, text })
    },
    []
  )

  const clearSelection = useCallback(() => {
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

    const handleHorizontalNav = (
      key: "ArrowLeft" | "ArrowRight",
      currentCenter: { cx: number; cy: number },
      allCandidates: WordCenter[]
    ) => {
      stickyXRef.current = null
      const sameLine = findNearestWordOnSameLine(currentCenter, allCandidates, key)
      if (sameLine) {
        setSelection(sameLine)
      } else {
        const wrapped = findFirstWordOnAdjacentLine(currentCenter, allCandidates, key)
        if (wrapped) setSelection(wrapped)
      }
    }

    const handleVerticalNav = (
      key: "ArrowUp" | "ArrowDown",
      currentCenter: { cx: number; cy: number },
      allCandidates: WordCenter[]
    ) => {
      if (stickyXRef.current === null) {
        stickyXRef.current = currentCenter.cx
      }
      const navCenter = { cx: stickyXRef.current, cy: currentCenter.cy }

      // 1. Try same-editor candidates first
      const sameEditorCandidates = allCandidates.filter(
        (c) => c.word.editorIndex === selection!.editorIndex
      )
      const sameEditorNearest = findNearestWord(navCenter, sameEditorCandidates, key)
      if (sameEditorNearest) {
        setSelection(sameEditorNearest)
        return
      }

      // 2. Try all candidates (cross-editor spatial)
      const nearest = findNearestWord(navCenter, allCandidates, key)
      if (nearest) {
        setSelection(nearest)
        return
      }

      // 3. Fall back to reading order to cross editor boundaries
      const fallbackDirection = key === "ArrowDown" ? "ArrowRight" as const : "ArrowLeft" as const
      const allWords = allCandidates.map((c) => c.word)
      const fallback = findWordInReadingOrder(selection!, allWords, fallbackDirection)
      if (fallback) setSelection(fallback)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!ARROW_KEYS.has(e.key)) return
      if (isEditableElement(document.activeElement)) return
      if (!selection) return

      e.preventDefault()

      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      const currentCenter = getWordCenter(selection, editorsRef, containerRect)
      if (!currentCenter) return

      const allCandidates = collectCandidates()

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        handleHorizontalNav(e.key, currentCenter, allCandidates)
      } else {
        handleVerticalNav(e.key as "ArrowUp" | "ArrowDown", currentCenter, allCandidates)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isLocked, selection, editorsRef, containerRef, editorCount])

  return { selection, selectWord, clearSelection }
}
