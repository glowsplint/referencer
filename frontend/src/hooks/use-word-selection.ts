import { useState, useCallback, useEffect, useRef } from "react"
import type { Editor } from "@tiptap/react"
import type { WordSelection } from "@/types/editor"
import type { WordCenter } from "@/lib/tiptap/nearest-word"
import {
  getWordCenter,
  findFirstWordOnLine,
  findLastWordOnLine,
  isAtLineStart,
  isAtLineEnd,
} from "@/lib/tiptap/nearest-word"
import { isEditableElement } from "@/lib/dom"
import {
  collectCandidates,
  resolveNavigationTarget,
  computeRangeSelection,
  findFirstWordInPassage,
  findLastWordInPassage,
  findHorizontalTargetConstrained,
  findVerticalTargetConstrained,
  computeSelectAllInPassage,
} from "@/lib/word-navigation"

const ARROW_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"])
const HAS_ALPHANUMERIC = /[a-zA-Z0-9]/

function isCmdKey(e: KeyboardEvent): boolean {
  return navigator.platform?.includes("Mac") ? e.metaKey : e.ctrlKey
}

interface UseWordSelectionOptions {
  isLocked: boolean
  editorsRef: React.RefObject<Map<number, Editor>>
  containerRef: React.RefObject<HTMLDivElement | null>
  editorCount: number
  onEnter?: () => void
  onEscape?: () => void
}

export function useWordSelection({
  isLocked,
  editorsRef,
  containerRef,
  editorCount,
  onEnter,
  onEscape,
}: UseWordSelectionOptions) {
  const [selection, setSelection] = useState<WordSelection | null>(null)
  const stickyXRef = useRef<number | null>(null)
  const anchorRef = useRef<WordSelection | null>(null)
  const headRef = useRef<WordSelection | null>(null)
  const onEnterRef = useRef(onEnter)
  onEnterRef.current = onEnter
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  const selectWord = useCallback(
    (editorIndex: number, from: number, to: number, text: string) => {
      if (!HAS_ALPHANUMERIC.test(text)) return
      anchorRef.current = null
      headRef.current = null
      setSelection({ editorIndex, from, to, text })
    },
    []
  )

  const selectRange = useCallback(
    (
      anchor: WordSelection,
      head: WordSelection,
      merged: WordSelection
    ) => {
      if (!HAS_ALPHANUMERIC.test(merged.text)) return
      anchorRef.current = anchor
      headRef.current = head
      setSelection(merged)
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
      return
    }
    // Seed selection at first word so arrow keys work immediately
    const container = containerRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const ctx = { editorsRef, containerRect, editorCount }
    const allCandidates = collectCandidates(ctx)
    const first = findFirstWordInPassage(0, allCandidates)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialise on prop change
    if (first) setSelection(first)
  }, [isLocked, editorsRef, containerRef, editorCount])

  useEffect(() => {
    if (!isLocked) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(document.activeElement)) return

      const cmd = isCmdKey(e)

      // ── Enter ───────────────────────────────────────────────────
      if (e.key === "Enter") {
        if (selection && onEnterRef.current) {
          e.preventDefault()
          onEnterRef.current()
        }
        return
      }

      // ── Escape ──────────────────────────────────────────────────
      if (e.key === "Escape") {
        if (selection) {
          e.preventDefault()
          anchorRef.current = null
          headRef.current = null
          setSelection(null)
        } else if (onEscapeRef.current) {
          e.preventDefault()
          onEscapeRef.current()
        }
        return
      }

      // ── Page Up/Down — let browser handle ──────────────────────
      if (e.key === "PageUp" || e.key === "PageDown") return

      // ── Cmd+A — select all in passage ──────────────────────────
      if (cmd && e.key === "a") {
        e.preventDefault()
        const container = containerRef.current
        if (!container) return
        const containerRect = container.getBoundingClientRect()
        const ctx = { editorsRef, containerRect, editorCount }
        const allCandidates = collectCandidates(ctx)
        const editorIndex = selection?.editorIndex ?? 0
        const editor = editorsRef.current.get(editorIndex)
        if (!editor) return
        const selectAll = computeSelectAllInPassage(
          editorIndex,
          allCandidates,
          editor
        )
        if (selectAll) {
          anchorRef.current = null
          headRef.current = null
          setSelection(selectAll)
        }
        return
      }

      // ── Tab / Shift+Tab — cycle passages ───────────────────────
      if (e.key === "Tab") {
        e.preventDefault()
        const container = containerRef.current
        if (!container) return
        const containerRect = container.getBoundingClientRect()
        const ctx = { editorsRef, containerRect, editorCount }
        const allCandidates = collectCandidates(ctx)
        const currentIndex = selection?.editorIndex ?? -1
        const direction = e.shiftKey ? -1 : 1

        for (let step = 1; step <= editorCount; step++) {
          const candidate =
            ((currentIndex + direction * step) % editorCount + editorCount) %
            editorCount
          const first = findFirstWordInPassage(candidate, allCandidates)
          if (first) {
            anchorRef.current = null
            headRef.current = null
            stickyXRef.current = null
            setSelection(first)
            return
          }
        }
        return
      }

      // ── Home / End (requires selection) ────────────────────────
      if (e.key === "Home" || e.key === "End") {
        if (!selection) return
        e.preventDefault()
        const container = containerRef.current
        if (!container) return
        const containerRect = container.getBoundingClientRect()
        const ctx = { editorsRef, containerRect, editorCount }
        const allCandidates = collectCandidates(ctx)
        const sameEditorCandidates = allCandidates.filter(
          (c) => c.word.editorIndex === selection.editorIndex
        )
        handleHomeEnd(
          e,
          selection,
          allCandidates,
          sameEditorCandidates,
          editorsRef,
          containerRect
        )
        return
      }

      // ── All remaining keys require arrow keys ──────────────────
      if (!ARROW_KEYS.has(e.key)) return
      if (!selection) return

      e.preventDefault()

      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      const ctx = { editorsRef, containerRect, editorCount }
      const allCandidates = collectCandidates(ctx)
      const sameEditorCandidates = allCandidates.filter(
        (c) => c.word.editorIndex === selection.editorIndex
      )

      // ── Cmd+Shift+Arrow — extend to boundaries ────────────────
      if (cmd && e.shiftKey) {
        handleCmdShiftArrow(
          e,
          selection,
          allCandidates,
          sameEditorCandidates,
          editorsRef,
          containerRect
        )
        return
      }

      // ── Cmd+Arrow — constrained navigation ────────────────────
      if (cmd) {
        handleCmdArrow(
          e,
          selection,
          allCandidates,
          sameEditorCandidates,
          editorsRef,
          containerRect
        )
        return
      }

      // ── Shift+Arrow — range extension ──────────────────────────
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
        return
      }

      // ── Plain arrow — normal navigation ────────────────────────
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

    // ── Home/End handler ───────────────────────────────────────────
    function handleHomeEnd(
      e: KeyboardEvent,
      sel: WordSelection,
      allCandidates: WordCenter[],
      sameEditorCandidates: WordCenter[],
      eRef: React.RefObject<Map<number, Editor>>,
      containerRect: DOMRect
    ) {
      const isEnd = e.key === "End"

      if (e.shiftKey) {
        // Progressive: line boundary first, then passage boundary
        if (!anchorRef.current) {
          anchorRef.current = sel
          headRef.current = sel
        }
        const head = headRef.current!
        const headCenter = getWordCenter(head, eRef, containerRect)
        if (!headCenter) return

        const atBoundary = isEnd
          ? isAtLineEnd(headCenter, sameEditorCandidates)
          : isAtLineStart(headCenter, sameEditorCandidates)

        let target: import("@/lib/tiptap/word-collection").CollectedWord | null
        if (atBoundary) {
          // Already at line boundary → go to passage boundary
          target = isEnd
            ? findLastWordInPassage(sel.editorIndex, allCandidates)
            : findFirstWordInPassage(sel.editorIndex, allCandidates)
        } else {
          // Go to line boundary
          target = isEnd
            ? findLastWordOnLine(headCenter, sameEditorCandidates)
            : findFirstWordOnLine(headCenter, sameEditorCandidates)
        }
        if (!target) return

        const editor = eRef.current.get(anchorRef.current.editorIndex)
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
        // Without Shift: jump to passage start/end
        anchorRef.current = null
        headRef.current = null
        stickyXRef.current = null
        const target = isEnd
          ? findLastWordInPassage(sel.editorIndex, allCandidates)
          : findFirstWordInPassage(sel.editorIndex, allCandidates)
        if (target) setSelection(target)
      }
    }

    // ── Cmd+Shift+Arrow handler ────────────────────────────────────
    function handleCmdShiftArrow(
      e: KeyboardEvent,
      sel: WordSelection,
      allCandidates: WordCenter[],
      sameEditorCandidates: WordCenter[],
      eRef: React.RefObject<Map<number, Editor>>,
      containerRect: DOMRect
    ) {
      if (!anchorRef.current) {
        anchorRef.current = sel
        headRef.current = sel
      }
      const head = headRef.current!
      const headCenter = getWordCenter(head, eRef, containerRect)
      if (!headCenter) return

      let target: import("@/lib/tiptap/word-collection").CollectedWord | null
      switch (e.key) {
        case "ArrowLeft":
          target = findFirstWordOnLine(headCenter, sameEditorCandidates)
          break
        case "ArrowRight":
          target = findLastWordOnLine(headCenter, sameEditorCandidates)
          break
        case "ArrowUp":
          target = findFirstWordInPassage(sel.editorIndex, allCandidates)
          break
        case "ArrowDown":
          target = findLastWordInPassage(sel.editorIndex, allCandidates)
          break
        default:
          return
      }
      if (!target) return

      const editor = eRef.current.get(anchorRef.current.editorIndex)
      if (!editor) return
      const rangeSelection = computeRangeSelection(
        anchorRef.current,
        target,
        editor
      )
      if (!rangeSelection) return

      headRef.current = target
      setSelection(rangeSelection)
    }

    // ── Cmd+Arrow handler ──────────────────────────────────────────
    function handleCmdArrow(
      e: KeyboardEvent,
      sel: WordSelection,
      allCandidates: WordCenter[],
      _sameEditorCandidates: WordCenter[],
      eRef: React.RefObject<Map<number, Editor>>,
      containerRect: DOMRect
    ) {
      anchorRef.current = null
      headRef.current = null

      const currentCenter = getWordCenter(sel, eRef, containerRect)
      if (!currentCenter) return

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const { target, stickyX } = findHorizontalTargetConstrained(
          e.key,
          currentCenter,
          allCandidates,
          sel
        )
        stickyXRef.current = stickyX
        if (target) setSelection(target)
      } else {
        const { target, stickyX } = findVerticalTargetConstrained(
          e.key as "ArrowUp" | "ArrowDown",
          currentCenter,
          allCandidates,
          sel,
          stickyXRef.current
        )
        stickyXRef.current = stickyX
        if (target) setSelection(target)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isLocked, selection, editorsRef, containerRef, editorCount])

  return { selection, selectWord, selectRange, clearSelection }
}
