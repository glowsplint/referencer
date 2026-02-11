import { useEffect, useRef } from "react"
import { isEditableElement } from "@/lib/dom"

type ToggleAction = "darkMode" | "layout" | "lock" | "menu"

const KEY_MAP: Record<string, ToggleAction> = {
  KeyD: "darkMode",
  KeyR: "layout",
  KeyK: "lock",
  KeyM: "menu",
}

interface UseToggleShortcutsOptions {
  toggleDarkMode: () => void
  toggleMultipleRowsLayout: () => void
  toggleLocked: () => void
  toggleManagementPane: () => void
}

export function useToggleShortcuts({
  toggleDarkMode,
  toggleMultipleRowsLayout,
  toggleLocked,
  toggleManagementPane,
}: UseToggleShortcutsOptions) {
  const callbacksRef = useRef({ toggleDarkMode, toggleMultipleRowsLayout, toggleLocked, toggleManagementPane })
  useEffect(() => {
    callbacksRef.current = { toggleDarkMode, toggleMultipleRowsLayout, toggleLocked, toggleManagementPane }
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (isEditableElement(e.target)) return

      const action = KEY_MAP[e.code]
      if (!action) return

      e.preventDefault()
      const { toggleDarkMode, toggleMultipleRowsLayout, toggleLocked, toggleManagementPane } = callbacksRef.current
      switch (action) {
        case "darkMode":
          toggleDarkMode()
          break
        case "layout":
          toggleMultipleRowsLayout()
          break
        case "lock":
          toggleLocked()
          break
        case "menu":
          toggleManagementPane()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])
}
