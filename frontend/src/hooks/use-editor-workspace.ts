import { useState, useCallback } from "react"
import { useSettings } from "./use-settings"
import { useLayers } from "./use-layers"
import { useEditors } from "./use-editors"

export function useEditorWorkspace() {
  const settingsHook = useSettings()
  const layersHook = useLayers()
  const editorsHook = useEditors()

  const [isManagementPaneOpen, setIsManagementPaneOpen] = useState(true)

  const toggleManagementPane = useCallback(
    () => setIsManagementPaneOpen((v) => !v),
    []
  )

  return {
    ...settingsHook,
    ...layersHook,
    ...editorsHook,
    isManagementPaneOpen,
    toggleManagementPane,
  }
}
