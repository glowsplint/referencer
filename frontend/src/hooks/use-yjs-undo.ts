// Yjs-based undo/redo manager. Replaces the command-pattern useActionHistory
// with Y.UndoManager that captures Y.Doc transactions. Scoped per-user so
// each participant can independently undo their own changes.
import { useEffect, useRef, useState, useCallback } from "react"
import * as Y from "yjs"
import { getLayersArray } from "@/lib/yjs/annotations"

export function useYjsUndo(doc: Y.Doc | null) {
  const undoManagerRef = useRef<Y.UndoManager | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    if (!doc) return

    // Track all shared types for undo: XmlFragments (text) + layers array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackedTypes: (Y.AbstractType<any>)[] = []

    // Track the layers array (annotations)
    trackedTypes.push(getLayersArray(doc))

    // Track all XmlFragments (editor text content)
    // We observe doc structure to catch dynamically created fragments
    for (let i = 0; i < 10; i++) {
      const fragment = doc.getXmlFragment(`editor-${i}`)
      if (fragment.length > 0 || i < 3) {
        trackedTypes.push(fragment)
      }
    }

    const undoManager = new Y.UndoManager(trackedTypes, {
      // Capture consecutive changes within 500ms as a single undo step
      captureTimeout: 500,
    })

    undoManagerRef.current = undoManager

    const updateFlags = () => {
      setCanUndo(undoManager.canUndo())
      setCanRedo(undoManager.canRedo())
    }

    undoManager.on("stack-item-added", updateFlags)
    undoManager.on("stack-item-popped", updateFlags)
    undoManager.on("stack-cleared", updateFlags)

    return () => {
      undoManager.destroy()
      undoManagerRef.current = null
      setCanUndo(false)
      setCanRedo(false)
    }
  }, [doc])

  const undo = useCallback(() => {
    undoManagerRef.current?.undo()
  }, [])

  const redo = useCallback(() => {
    undoManagerRef.current?.redo()
  }, [])

  return { undo, redo, canUndo, canRedo }
}
