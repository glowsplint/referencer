import { useRef, useState, useCallback } from "react"
import type { ActionEntry, ActionCommand } from "@/types/editor"

interface StoredCommand extends ActionCommand {
  id: string
}

export function useActionHistory() {
  const undoStackRef = useRef<StoredCommand[]>([])
  const redoStackRef = useRef<StoredCommand[]>([])
  const [log, setLog] = useState<ActionEntry[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0)
    setCanRedo(redoStackRef.current.length > 0)
  }, [])

  const record = useCallback(
    (command: ActionCommand) => {
      const id = crypto.randomUUID()
      const stored: StoredCommand = { ...command, id }
      undoStackRef.current.push(stored)
      redoStackRef.current = []

      const entry: ActionEntry = {
        id,
        type: command.type,
        description: command.description,
        timestamp: Date.now(),
        undone: false,
      }
      setLog((prev) => [...prev, entry])
      updateFlags()
    },
    [updateFlags]
  )

  const undo = useCallback(() => {
    const command = undoStackRef.current.pop()
    if (!command) return
    command.undo()
    redoStackRef.current.push(command)

    setLog((prev) =>
      prev.map((entry) =>
        entry.id === command.id ? { ...entry, undone: true } : entry
      )
    )
    updateFlags()
  }, [updateFlags])

  const redo = useCallback(() => {
    const command = redoStackRef.current.pop()
    if (!command) return
    command.redo()
    undoStackRef.current.push(command)

    setLog((prev) =>
      prev.map((entry) =>
        entry.id === command.id ? { ...entry, undone: false } : entry
      )
    )
    updateFlags()
  }, [updateFlags])

  return { record, undo, redo, canUndo, canRedo, log }
}
