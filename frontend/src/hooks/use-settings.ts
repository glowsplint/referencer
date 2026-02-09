import { useEffect, useState } from "react"
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

  const toggleSetting = (key: keyof EditorSettings) => () =>
    setSettings((s) => ({ ...s, [key]: !s[key] }))

  const togglePainterMode = () =>
    setAnnotations((a) => ({ ...a, isPainterMode: !a.isPainterMode }))

  return {
    settings,
    annotations,
    toggleSetting,
    togglePainterMode,
  }
}
