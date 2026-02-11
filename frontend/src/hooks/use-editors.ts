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
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null)
  const editorsRef = useRef<Map<number, Editor>>(new Map())

  const addEditor = useCallback(() => {
    setEditorCount((count) => {
      if (count >= 3) return count
      const newCount = count + 1
      setSplitPositions(computeEvenSplitPositions(newCount))
      setSectionVisibility((prev) => [...prev, true])
      setSectionNames((prev) => [...prev, `Passage ${prev.length + 1}`])
      return newCount
    })
  }, [])

  const removeEditor = useCallback((index: number) => {
    setEditorCount((count) => {
      if (count <= 1) return count
      const newCount = count - 1
      editorsRef.current.delete(index)
      // Re-key remaining editors
      const newMap = new Map<number, Editor>()
      let newIndex = 0
      for (let i = 0; i < count; i++) {
        if (i === index) continue
        const editor = editorsRef.current.get(i)
        if (editor) newMap.set(newIndex, editor)
        newIndex++
      }
      editorsRef.current = newMap
      setSplitPositions(computeEvenSplitPositions(newCount))
      setSectionVisibility((prev) => prev.filter((_, i) => i !== index))
      setSectionNames((prev) => prev.filter((_, i) => i !== index))
      // Set active editor to the first remaining editor
      const firstEditor = newMap.get(0)
      if (firstEditor) setActiveEditor(firstEditor)
      return newCount
    })
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
    editorsRef,
    addEditor,
    removeEditor,
    updateSectionName,
    toggleSectionVisibility,
    toggleAllSectionVisibility,
    handleDividerResize,
    handleEditorMount,
    handlePaneFocus,
  }
}
