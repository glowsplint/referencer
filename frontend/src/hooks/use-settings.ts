import { useEffect, useState, useCallback } from "react"
import type { EditorSettings, AnnotationSettings, ActiveTool } from "@/types/editor"

function useToggle<T>(
  setter: React.Dispatch<React.SetStateAction<T>>,
  key: keyof T
) {
  return useCallback(
    () => setter((prev) => ({ ...prev, [key]: !prev[key] })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
}

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>({
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    isLocked: false,
  })
  const [annotations, setAnnotations] = useState<AnnotationSettings>({
    activeTool: "selection",
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.isDarkMode)
  }, [settings.isDarkMode])

  const toggleDarkMode = useToggle(setSettings, "isDarkMode")
  const toggleLayersOn = useToggle(setSettings, "isLayersOn")
  const toggleMultipleRowsLayout = useToggle(setSettings, "isMultipleRowsLayout")
  const toggleLocked = useToggle(setSettings, "isLocked")
  const setActiveTool = useCallback(
    (tool: ActiveTool) => setAnnotations({ activeTool: tool }),
    []
  )

  return {
    settings,
    annotations,
    toggleDarkMode,
    toggleLayersOn,
    toggleMultipleRowsLayout,
    toggleLocked,
    setActiveTool,
  }
}
