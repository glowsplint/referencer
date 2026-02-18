// Manages the action console panel (toggle with backtick key, resize height).
import { useState, useEffect } from "react"
import { isEditableElement } from "@/lib/dom"

export function useActionConsole() {
  const [isOpen, setIsOpen] = useState(false)
  const [consoleHeight, setConsoleHeight] = useState(192)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "`") return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (isEditableElement(e.target)) return

      e.preventDefault()
      setIsOpen((v) => !v)
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return { isOpen, setIsOpen, consoleHeight, setConsoleHeight }
}
