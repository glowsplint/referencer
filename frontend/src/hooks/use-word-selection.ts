import { useState, useCallback, useEffect, useRef } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"
import { getWordCenter } from "@/lib/tiptap/nearest-word"
import { isEditableElement } from "@/lib/dom"
import {
  collectCandidates,
  resolveNavigationTarget,
  computeRangeSelection,
} from "@/lib/word-navigation"

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!ARROW_KEYS.has(e.key)) return
      if (isEditableElement(document.activeElement)) return
      if (!selection) return

      e.preventDefault()

      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      const ctx = { editorsRef, containerRect, editorCount }
      const allCandidates = collectCandidates(ctx)

      if (e.shiftKey) {
        // Initialize anchor/head on first shift+arrow
        if (!anchorRef.current) {
          anchorRef.current = selection
          headRef.current = selection
        }

        const head = headRef.current!
        const currentCenter = getWordCenter(head, editorsRef, containerRect)
        if (!currentCenter) return

        const { target, stickyX } = resolveNavigationTarget(
          e.key,
          currentCenter,
          allCandidates,
          head,
          stickyXRef.current
        )
        stickyXRef.current = stickyX

        if (!target) return

        const editor = editorsRef.current.get(anchorRef.current.editorIndex)
        if (!editor) return

        const rangeSelection = computeRangeSelection(
          anchorRef.current,
          target,
          editor
        )
        if (!rangeSelection) return

        headRef.current = target
        setSelection(rangeSelection)
      } else {
        // Normal navigation (no shift)
        anchorRef.current = null
        headRef.current = null

        const currentCenter = getWordCenter(selection, editorsRef, containerRect)
        if (!currentCenter) return

        const { target, stickyX } = resolveNavigationTarget(
          e.key,
          currentCenter,
          allCandidates,
          selection,
          stickyXRef.current
        )
        stickyXRef.current = stickyX

        if (target) setSelection(target)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isLocked, selection, editorsRef, containerRef, editorCount])

  return { selection, selectWord, clearSelection }
}
