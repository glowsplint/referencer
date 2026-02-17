// Manages the multi-pane editor layout: add/remove passages (up to 3),
// track split positions, section visibility/names, and active editor focus.
// Handles divider resize with minimum pane width constraints.
import { useRef, useState, useCallback, useMemo } from "react"
import type { Editor } from "@tiptap/react"

const MIN_EDITOR_PCT = 10

function computeEvenSplitPositions(count: number): number[] {
  return Array.from({ length: count - 1 }, (_, i) => ((i + 1) / count) * 100)
}

export function useEditors() {
  const [editorCount, setEditorCount] = useState(1)
  const [splitPositions, setSplitPositions] = useState<number[]>([])
  const [sectionVisibility, setSectionVisibility] = useState<boolean[]>([true])
  const [sectionNames, setSectionNames] = useState<string[]>(["Passage 1"])
  const [editorKeys, setEditorKeys] = useState<number[]>([0])
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null)
  const editorsRef = useRef<Map<number, Editor>>(new Map())
  const passageCounterRef = useRef(1)
  const editorCountRef = useRef(1)
  const editorKeyCounterRef = useRef(1)

  const addEditor = useCallback((opts?: { name?: string }): string => {
    if (editorCountRef.current >= 3) {
      return opts?.name ?? `Passage ${passageCounterRef.current}`
    }
    if (!opts?.name) {
      passageCounterRef.current += 1
    }
    const name = opts?.name ?? `Passage ${passageCounterRef.current}`
    const newCount = editorCountRef.current + 1
    editorCountRef.current = newCount
    setEditorCount(newCount)
    setSplitPositions(computeEvenSplitPositions(newCount))
    setSectionVisibility((prev) => [...prev, true])
    setSectionNames((prev) => [...prev, name])
    const key = editorKeyCounterRef.current++
    setEditorKeys((prev) => [...prev, key])
    return name
  }, [])

  const removeEditor = useCallback((index: number) => {
    if (editorCountRef.current <= 1) return
    const oldCount = editorCountRef.current
    const newCount = oldCount - 1
    editorCountRef.current = newCount
    editorsRef.current.delete(index)
    // Re-key remaining editors
    const newMap = new Map<number, Editor>()
    let newIndex = 0
    for (let i = 0; i < oldCount; i++) {
      if (i === index) continue
      const editor = editorsRef.current.get(i)
      if (editor) newMap.set(newIndex, editor)
      newIndex++
    }
    editorsRef.current = newMap
    setEditorCount(newCount)
    setSplitPositions(computeEvenSplitPositions(newCount))
    setSectionVisibility((prev) => prev.filter((_, i) => i !== index))
    setSectionNames((prev) => prev.filter((_, i) => i !== index))
    setEditorKeys((prev) => prev.filter((_, i) => i !== index))
    // Set active editor to the first remaining editor
    const firstEditor = newMap.get(0)
    if (firstEditor) setActiveEditor(firstEditor)
  }, [])

  const updateSectionName = useCallback((index: number, name: string) => {
    setSectionNames((prev) =>
      prev.map((n, i) => (i === index ? name : n))
    )
  }, [])

  const toggleSectionVisibility = useCallback((index: number) => {
    setSectionVisibility((prev) =>
      prev.map((v, i) => (i === index ? !v : v))
    )
  }, [])

  const toggleAllSectionVisibility = useCallback(() => {
    setSectionVisibility((prev) => {
      const anyVisible = prev.some((v) => v)
      return prev.map(() => !anyVisible)
    })
  }, [])

  const handleDividerResize = useCallback((index: number, pct: number) => {
    setSplitPositions((positions) => {
      const newPositions = [...positions]
      const lower =
        index > 0 ? positions[index - 1] + MIN_EDITOR_PCT : MIN_EDITOR_PCT
      const upper =
        index < positions.length - 1
          ? positions[index + 1] - MIN_EDITOR_PCT
          : 100 - MIN_EDITOR_PCT
      newPositions[index] = Math.min(upper, Math.max(lower, pct))
      return newPositions
    })
  }, [])

  const handleEditorMount = useCallback((index: number, editor: Editor) => {
    editorsRef.current.set(index, editor)
    if (index === 0) {
      setActiveEditor(editor)
    }
  }, [])

  const reorderEditors = useCallback((permutation: number[]) => {
    setSectionNames(prev => permutation.map(old => prev[old]))
    setSectionVisibility(prev => permutation.map(old => prev[old]))
    setEditorKeys(prev => permutation.map(old => prev[old]))
    setSplitPositions(computeEvenSplitPositions(permutation.length))
    // Re-key editorsRef according to permutation
    const oldMap = editorsRef.current
    const newMap = new Map<number, Editor>()
    for (let newIdx = 0; newIdx < permutation.length; newIdx++) {
      const oldIdx = permutation[newIdx]
      const editor = oldMap.get(oldIdx)
      if (editor) newMap.set(newIdx, editor)
    }
    editorsRef.current = newMap
  }, [])

  const handlePaneFocus = useCallback((index: number) => {
    const editor = editorsRef.current.get(index)
    if (editor) {
      setActiveEditor(editor)
    }
  }, [])

  const editorWidths = useMemo(() => {
    const widths: number[] = []
    for (let i = 0; i < editorCount; i++) {
      const start = i === 0 ? 0 : splitPositions[i - 1]
      const end = i === editorCount - 1 ? 100 : splitPositions[i]
      widths.push(end - start)
    }
    return widths
  }, [editorCount, splitPositions])

  return {
    editorCount,
    activeEditor,
    editorWidths,
    sectionVisibility,
    sectionNames,
    editorKeys,
    editorsRef,
    addEditor,
    removeEditor,
    updateSectionName,
    toggleSectionVisibility,
    toggleAllSectionVisibility,
    handleDividerResize,
    reorderEditors,
    handleEditorMount,
    handlePaneFocus,
    setEditorCount: (count: number) => {
      editorCountRef.current = count
      setEditorCount(count)
    },
    setSectionNames,
    setSectionVisibility,
    setSplitPositions,
  }
}
