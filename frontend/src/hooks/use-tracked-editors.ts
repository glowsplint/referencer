// Wraps the raw useEditors hook to record every editor mutation (add, remove,
// rename, toggle visibility) in the action history for undo/redo support.
import { useCallback } from "react"
import type { useEditors } from "./use-editors"
import type { useActionHistory } from "./use-action-history"

type EditorsHook = ReturnType<typeof useEditors>
type History = ReturnType<typeof useActionHistory>

export function useTrackedEditors(raw: EditorsHook, history: History) {
  const { record } = history

  const addEditor = useCallback(() => {
    const prevCount = raw.editorCount
    if (prevCount >= 3) return
    const name = raw.addEditor()
    record({
      type: "addEditor",
      description: `Added passage '${name}'`,
      details: [{ label: "name", after: name }],
      undo: () => {
        raw.removeEditor(prevCount)
      },
      redo: () => {
        raw.addEditor({ name })
      },
    })
  }, [raw, record])

  const removeEditor = useCallback(
    (index: number) => {
      if (raw.editorCount <= 1) return
      const name = raw.sectionNames[index]
      const visibility = raw.sectionVisibility[index]
      raw.removeEditor(index)
      record({
        type: "removeEditor",
        description: `Removed passage '${name}'`,
        details: [{ label: "name", before: name }],
        undo: () => {
          raw.addEditor({ name })
          if (!visibility) {
            raw.setSectionVisibility((prev) => {
              const copy = [...prev]
              copy[copy.length - 1] = false
              return copy
            })
          }
        },
        redo: () => {
          raw.removeEditor(index)
        },
      })
    },
    [raw, record]
  )

  const updateSectionName = useCallback(
    (index: number, name: string) => {
      const oldName = raw.sectionNames[index] ?? ""
      raw.updateSectionName(index, name)
      record({
        type: "updateSectionName",
        description: `Renamed passage '${oldName}' to '${name}'`,
        details: [{ label: "name", before: oldName, after: name }],
        undo: () => {
          raw.updateSectionName(index, oldName)
        },
        redo: () => {
          raw.updateSectionName(index, name)
        },
      })
    },
    [raw, record]
  )

  const toggleAllSectionVisibility = useCallback(() => {
    const anyVisible = raw.sectionVisibility.some((v) => v)
    raw.toggleAllSectionVisibility()
    record({
      type: anyVisible ? "hideAllPassages" : "showAllPassages",
      description: anyVisible ? "Hid all passages" : "Showed all passages",
      undo: () => raw.toggleAllSectionVisibility(),
      redo: () => raw.toggleAllSectionVisibility(),
    })
  }, [raw, record])

  return {
    ...raw,
    addEditor,
    removeEditor,
    updateSectionName,
    toggleAllSectionVisibility,
  }
}
