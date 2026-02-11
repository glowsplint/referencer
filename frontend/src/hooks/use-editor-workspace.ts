import { useState, useCallback } from "react"
import { useSettings } from "./use-settings"
import { useLayers } from "./use-layers"
import { useEditors } from "./use-editors"
import { useActionHistory } from "./use-action-history"
import { useTrackedLayers } from "./use-tracked-layers"
import { useTrackedEditors } from "./use-tracked-editors"

export function useEditorWorkspace() {
  const settingsHook = useSettings()
  const rawLayersHook = useLayers()
  const rawEditorsHook = useEditors()
  const history = useActionHistory()

  const layersHook = useTrackedLayers(rawLayersHook, history)
  const editorsHook = useTrackedEditors(rawEditorsHook, history)

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
    history,
  }
}
