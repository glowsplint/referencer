import { useEffect, useRef } from "react"
import { isEditableElement } from "@/lib/dom"
import type { ActiveTool } from "@/types/editor"

const KEY_MAP: Record<string, ActiveTool> = {
  KeyS: "selection",
  KeyA: "arrow",
  KeyC: "comments",
}

interface UseToolShortcutsOptions {
  isLocked: boolean
  setActiveTool: (tool: ActiveTool) => void
}

export function useToolShortcuts({
  isLocked,
  setActiveTool,
}: UseToolShortcutsOptions) {
  const setActiveToolRef = useRef(setActiveTool)
  useEffect(() => {
    setActiveToolRef.current = setActiveTool
  })

  useEffect(() => {
    if (!isLocked) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (isEditableElement(e.target)) return

      const tool = KEY_MAP[e.code]
      if (tool) {
        e.preventDefault()
        setActiveToolRef.current(tool)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isLocked])
}
