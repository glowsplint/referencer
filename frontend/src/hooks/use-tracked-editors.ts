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
    raw.addEditor()
    record({
      type: "addEditor",
      description: "Added passage",
      undo: () => {
        raw.removeEditor(prevCount)
      },
      redo: () => {
        raw.addEditor()
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
        undo: () => {
          raw.addEditor()
          // Restore the name of the re-added editor
          raw.setSectionNames((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = name
            return copy
          })
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

  return {
    ...raw,
    addEditor,
    removeEditor,
  }
}
