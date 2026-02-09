import { useState, useCallback, useEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"
import { collectAllWords } from "@/lib/tiptap/word-collection"
import { getWordCenter, findNearestWord } from "@/lib/tiptap/nearest-word"

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

      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      // Get current word center
      const currentCenter = getWordCenter(selection, editorsRef, containerRect)
      if (!currentCenter) return

      // Collect all words from all editors
      const allCandidates = []
      for (let i = 0; i < editorCount; i++) {
        const editor = editorsRef.current.get(i)
        if (!editor) continue
        const words = collectAllWords(editor, i)
        for (const word of words) {
          const center = getWordCenter(word, editorsRef, containerRect)
          if (center) {
            allCandidates.push({ word, ...center })
          }
        }
      }

      const nearest = findNearestWord(
        currentCenter,
        allCandidates,
        e.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"
      )

      if (nearest) {
        setSelection(nearest)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isLocked, selection, editorsRef, containerRef, editorCount])

  return { selection, selectWord, clearSelection }
}
