import { useState, useCallback } from "react"

const STORAGE_KEY = "referencer-custom-colors"

function loadColors(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveColors(colors: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
}

export function useCustomColors() {
  const [customColors, setCustomColors] = useState<string[]>(loadColors)

  const addCustomColor = useCallback((hex: string) => {
    setCustomColors((prev) => {
      if (prev.includes(hex)) return prev
      const next = [...prev, hex]
      saveColors(next)
      return next
    })
  }, [])

  const removeCustomColor = useCallback((hex: string) => {
    setCustomColors((prev) => {
      const next = prev.filter((c) => c !== hex)
      saveColors(next)
      return next
    })
  }, [])

  return { customColors, addCustomColor, removeCustomColor }
}
