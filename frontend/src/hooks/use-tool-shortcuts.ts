import { useEffect, useRef } from "react"
import { isEditableElement } from "@/lib/dom"
import type { ActiveTool } from "@/types/editor"

const KEY_MAP: Record<string, ActiveTool> = {
  KeyS: "selection",
  KeyA: "arrow",
  KeyC: "comments",
  KeyH: "highlight",
  KeyU: "underline",
}

const LONG_PRESS_MS = 500

interface UseToolShortcutsOptions {
  isLocked: boolean
  setActiveTool: (tool: ActiveTool) => void
  onArrowLongPress?: () => void
}

export function useToolShortcuts({
  isLocked,
  setActiveTool,
  onArrowLongPress,
}: UseToolShortcutsOptions) {
  const setActiveToolRef = useRef(setActiveTool)
  useEffect(() => {
    setActiveToolRef.current = setActiveTool
  })

  const onArrowLongPressRef = useRef(onArrowLongPress)
  useEffect(() => {
    onArrowLongPressRef.current = onArrowLongPress
  })

  useEffect(() => {
    if (!isLocked) return

    let arrowKeyDownTime: number | null = null
    let arrowLongPressTimer: ReturnType<typeof setTimeout> | null = null
    let arrowLongPressFired = false

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (isEditableElement(e.target)) return

      const tool = KEY_MAP[e.code]
      if (!tool) return

      e.preventDefault()

      if (e.code === "KeyA" && onArrowLongPressRef.current) {
        arrowKeyDownTime = Date.now()
        arrowLongPressFired = false
        arrowLongPressTimer = setTimeout(() => {
          arrowLongPressFired = true
          onArrowLongPressRef.current?.()
        }, LONG_PRESS_MS)
        return
      }

      setActiveToolRef.current(tool)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "KeyA") return
      if (arrowLongPressTimer) {
        clearTimeout(arrowLongPressTimer)
        arrowLongPressTimer = null
      }
      if (!arrowLongPressFired && arrowKeyDownTime !== null) {
        setActiveToolRef.current("arrow")
      }
      arrowKeyDownTime = null
      arrowLongPressFired = false
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
      if (arrowLongPressTimer) clearTimeout(arrowLongPressTimer)
    }
  }, [isLocked])
}
