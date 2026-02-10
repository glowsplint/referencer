import { useState, useCallback, useEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"
import { collectAllWords } from "@/lib/tiptap/word-collection"
import {
  getWordCenter,
  findNearestWord,
  findNearestWordOnSameLine,
  findFirstWordOnAdjacentLine,
  findWordInReadingOrder,
} from "@/lib/tiptap/nearest-word"

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

  const selectWord = useCallback(
    (editorIndex: number, from: number, to: number, text: string) => {
      if (!/[a-zA-Z0-9]/.test(text)) return
      setSelection({ editorIndex, from, to, text })
    },
    []
  )

  const clearSelection = useCallback(() => {
    setSelection(null)
  }, [])

  // Clear selection when unlocking
  useEffect(() => {
    if (!isLocked) {
      setSelection(null)
    }
  }, [isLocked])

  // Arrow key navigation
  useEffect(() => {
    if (!isLocked) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "ArrowUp" &&
        e.key !== "ArrowDown"
      ) {
        return
      }

      if (!selection) return

      e.preventDefault()

      // Collect all words from all editors
      const allWords = []
      for (let i = 0; i < editorCount; i++) {
        const editor = editorsRef.current.get(i)
        if (!editor) continue
        allWords.push(...collectAllWords(editor, i))
      }

      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      const currentCenter = getWordCenter(selection, editorsRef, containerRect)
      if (!currentCenter) return

      const allCandidates = []
      for (const word of allWords) {
        const center = getWordCenter(word, editorsRef, containerRect)
        if (center) {
          allCandidates.push({ word, ...center })
        }
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // Same-line spatial (crosses editors on the same visual row)
        const sameLine = findNearestWordOnSameLine(
          currentCenter,
          allCandidates,
          e.key
        )
        if (sameLine) {
          setSelection(sameLine)
        } else {
          // End of visual row — wrap to next/prev row across all editors
          const wrapped = findFirstWordOnAdjacentLine(
            currentCenter,
            allCandidates,
            e.key
          )
          if (wrapped) {
            setSelection(wrapped)
          }
        }
      } else {
        // Spatial navigation for Up/Down
        const nearest = findNearestWord(
          currentCenter,
          allCandidates,
          e.key as "ArrowUp" | "ArrowDown"
        )

        if (nearest) {
          setSelection(nearest)
        } else {
          // Fall back to reading order to cross editor boundaries
          const fallbackDirection = e.key === "ArrowDown" ? "ArrowRight" : "ArrowLeft"
          const fallback = findWordInReadingOrder(selection, allWords, fallbackDirection)
          if (fallback) {
            setSelection(fallback)
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isLocked, selection, editorsRef, containerRef, editorCount])

  return { selection, selectWord, clearSelection }
}
