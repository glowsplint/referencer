// Manages all UI settings (dark mode, layout, lock state, toast preferences)
// persisted to localStorage. Also tracks transient annotation state like
// the active tool, arrow style picker, and selected arrow.
import { useEffect, useState, useCallback } from "react";
import type { EditorSettings, AnnotationSettings, ActiveTool, ArrowStyle } from "@/types/editor";

const STORAGE_KEY = "referencer-settings";

const DEFAULT_SETTINGS: EditorSettings = {
  isDarkMode: false,
  isLayersOn: false,
  isMultipleRowsLayout: false,
  isLocked: true,
  showDrawingToasts: true,
  showCommentsToasts: true,
  showHighlightToasts: true,
  overscrollEnabled: false,
  hideOffscreenArrows: false,
};

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function useToggle<T>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) {
  return useCallback(() => setter((prev) => ({ ...prev, [key]: !prev[key] })), [setter, key]);
}

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);
  const [annotations, setAnnotations] = useState<AnnotationSettings>({
    activeTool: "selection",
  });
  const [activeArrowStyle, setActiveArrowStyle] = useState<ArrowStyle>("solid");
  const [arrowStylePickerOpen, setArrowStylePickerOpen] = useState(false);
  const [selectedArrow, setSelectedArrow] = useState<{ layerId: string; arrowId: string } | null>(
    null,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.isDarkMode);
  }, [settings.isDarkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle("overscroll-enabled", settings.overscrollEnabled);
  }, [settings.overscrollEnabled]);

  const toggleDarkMode = useToggle(setSettings, "isDarkMode");
  const toggleLayersOn = useToggle(setSettings, "isLayersOn");
  const toggleMultipleRowsLayout = useToggle(setSettings, "isMultipleRowsLayout");
  const toggleLocked = useToggle(setSettings, "isLocked");
  const toggleShowDrawingToasts = useToggle(setSettings, "showDrawingToasts");
  const toggleShowCommentsToasts = useToggle(setSettings, "showCommentsToasts");
  const toggleShowHighlightToasts = useToggle(setSettings, "showHighlightToasts");
  const toggleOverscrollEnabled = useToggle(setSettings, "overscrollEnabled");
  const toggleHideOffscreenArrows = useToggle(setSettings, "hideOffscreenArrows");
  const setActiveTool = useCallback((tool: ActiveTool) => setAnnotations({ activeTool: tool }), []);

  return {
    settings,
    annotations,
    activeArrowStyle,
    setActiveArrowStyle,
    arrowStylePickerOpen,
    setArrowStylePickerOpen,
    selectedArrow,
    setSelectedArrow,
    toggleDarkMode,
    toggleLayersOn,
    toggleMultipleRowsLayout,
    toggleLocked,
    toggleShowDrawingToasts,
    toggleShowCommentsToasts,
    toggleShowHighlightToasts,
    toggleOverscrollEnabled,
    toggleHideOffscreenArrows,
    setActiveTool,
  };
}
