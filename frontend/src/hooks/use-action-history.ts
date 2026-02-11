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

  const addLogEntry = useCallback(
    (type: string, description: string): ActionEntry => {
      const entry: ActionEntry = {
        id: crypto.randomUUID(),
        type,
        description,
        timestamp: Date.now(),
        undone: false,
      }
      setLog((prev) => [...prev, entry])
      return entry
    },
    []
  )

  const record = useCallback(
    (command: ActionCommand) => {
      const entry = addLogEntry(command.type, command.description)
      const stored: StoredCommand = { ...command, id: entry.id }
      undoStackRef.current.push(stored)
      redoStackRef.current = []
      updateFlags()
    },
    [addLogEntry, updateFlags]
  )

  const logOnly = useCallback(
    (type: string, description: string) => {
      addLogEntry(type, description)
    },
    [addLogEntry]
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

  return { record, logOnly, undo, redo, canUndo, canRedo, log }
}
