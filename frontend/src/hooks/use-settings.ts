import { useEffect, useState, useCallback } from "react"
import type { EditorSettings, AnnotationSettings } from "@/types/editor"

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>({
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    isLocked: false,
  })
  const [annotations, setAnnotations] = useState<AnnotationSettings>({
    isPainterMode: false,
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.isDarkMode)
  }, [settings.isDarkMode])

  const toggleDarkMode = useCallback(
    () => setSettings((s) => ({ ...s, isDarkMode: !s.isDarkMode })),
    []
  )
  const toggleLayersOn = useCallback(
    () => setSettings((s) => ({ ...s, isLayersOn: !s.isLayersOn })),
    []
  )
  const toggleMultipleRowsLayout = useCallback(
    () => setSettings((s) => ({ ...s, isMultipleRowsLayout: !s.isMultipleRowsLayout })),
    []
  )
  const toggleLocked = useCallback(
    () => setSettings((s) => ({ ...s, isLocked: !s.isLocked })),
    []
  )

  const togglePainterMode = useCallback(
    () => setAnnotations((a) => ({ ...a, isPainterMode: !a.isPainterMode })),
    []
  )

  return {
    settings,
    annotations,
    toggleDarkMode,
    toggleLayersOn,
    toggleMultipleRowsLayout,
    toggleLocked,
    togglePainterMode,
  }
}
