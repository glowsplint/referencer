import { useEffect } from "react"
import { isEditableElement } from "@/lib/dom"
import type { useActionHistory } from "./use-action-history"

type History = ReturnType<typeof useActionHistory>

export function useUndoRedoKeyboard(history: History) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey || e.key.toLowerCase() !== "z") return
      if (isEditableElement(e.target)) return

      e.preventDefault()
      if (e.shiftKey) {
        history.redo()
      } else {
        history.undo()
      }
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [history])
}
