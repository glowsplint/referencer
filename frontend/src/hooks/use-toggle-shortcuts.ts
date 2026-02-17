// Registers global keyboard shortcuts for toggling UI settings:
// D = dark mode, R = row/column layout, K = lock/unlock, M = management pane.
// Lock toggle (K) works even inside editable elements (e.g. Tiptap editor).
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
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return

      const action = KEY_MAP[e.code]
      if (!action) return

      // Allow lock toggle (K) even when in editable elements (e.g. Tiptap editor)
      if (action !== "lock" && isEditableElement(e.target)) return

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
          (document.activeElement as HTMLElement)?.blur?.()
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
